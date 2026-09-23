# FactTest Reference Corpus

[RUN] Canonical Termux-acquired reference artifact is stored here as:

    FactTest_Termux_Reference_Corpus.txt.xz

The archive is a lossless XZ compression of the uploaded UTF-8 corpus.

Uncompressed identity:
- filename: FactTest_Termux_Reference_Corpus.txt
- bytes: 10951681
- SHA-256: c3269e8d85132f8857bb06a6703250bcd81ebffc1f9d1a9d2a56275f9dfb6957
- FTREF format: FTREF/2
- embedded file records: 516
- pinned project target: wasm64-unknown-unknown
- Rust commit: 48a229ceaefd4985c50990b14116b6d856af0985
- WebAssembly spec commit: 608711107b7f1edb13efd57b7d79b49477462d36

Compressed identity:
- bytes: 1305612
- SHA-256: 40037b18116c92cd36e2139fa9cc7e9daf17f94d34ce06e9c106d6d1a8d894cf
- Git blob SHA-1: 0c31efa031d89bd964cf53e06bf367afe8738b4b

Extraction:

    xz -dk FactTest_Termux_Reference_Corpus.txt.xz

[ERR] Known packaging discrepancy preserved, not hidden:
The uploaded FTREF/2 corpus contains one extra trailing LF in the embedded
test/core/memory64/load64.wast record relative to that record's declared
upstream BYTES/SHA256. The archive preserves the uploaded corpus byte-for-byte.
Semantic/reference analysis may use it as-is; any later canonical byte-repair
must be an explicit verified transformation with its own receipt.
