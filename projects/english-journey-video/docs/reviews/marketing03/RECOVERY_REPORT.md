# Video 03 V1.1 — Khôi phục WAV và kiểm thử pipeline

**Kết luận: NOT READY để tiếp tục sản xuất thật.** Pipeline ghi/nhận WAV cục bộ và Remotion đã đạt kiểm tra; còn thiếu WAV HOOK và credential REST bảo mật. Lượt này **0 yêu cầu Azure, 0 USD phí dịch vụ mới, 0 frame Video 03 được render**.

Checkpoint ban đầu: `5bc6faac1e3c0ab19cdec3069457ce71536d3f47`, branch `feat/english-journey-marketing-video-03`, PR #6. Kịch bản V1.1 và các file Video 01/02 không đổi.

## 1. Khôi phục HOOK: HOOK_RECOVERY_FAILED

Đã kiểm tra workspace/output cũ, đường dẫn shared download có trong ledger, thư mục tải của trình duyệt, source HOOK trên Speech Studio, Export history, Audio library và tìm file HOOK Video03 trong tài liệu đã lưu. Thư mục tải cũ trống; Export history báo không có audio; Audio library trống. Tìm kiếm tài liệu chỉ có ảnh nguồn và tài liệu liên quan, không có ứng viên WAV Video03.

Source HOOK vẫn có đúng 61 ký tự và `vi-VN-NamMinhNeural`. Chưa có file WAV nên **không thể xác nhận header, dung lượng, thời lượng, SHA-256 hay nguồn audio**. Không nhấn Play/Export, không tạo lại HOOK. Không dùng test tone thay cho HOOK.

`azure-ledger.json` giữ nguyên cả sáu phần tử `calls` từ checkpoint: attempts = `[1,0,0,0,0,0]`, status/attemptUtc/downloadPath cũ không đổi. Chỉ bổ sung kết quả recovery ở cấp ngoài. Runtime ledger khởi tạo bằng ghi độc quyền; không ghi đè hoặc reset lịch sử có sẵn.

## 2. Nhận WAV trực tiếp và kiểm thử thực tế

Đã thêm `scripts/marketing03/direct-audio.mjs`, không phụ thuộc nút Export của Speech Studio:

1. Dựng SSML từ đúng canonical text, Nam Minh, rate/pitch mặc định.
2. Endpoint cố định Southeast Asia; header `X-Microsoft-OutputFormat: riff-48khz-16bit-mono-pcm`.
3. Nhận body nhị phân trực tiếp, chặn redirect, không vòng lặp retry, giới hạn dung lượng và timeout.
4. Parse các chunk RIFF, kiểm tra PCM 48.000 Hz / mono / 16-bit, byte rate, block alignment, payload và thời lượng.
5. Ghi file tạm độc quyền, fsync, chạy full FFmpeg decode + ffprobe, đọc lại và so SHA-256.
6. Chỉ sau khi kiểm tra thành công mới công bố WAV bằng hard-link độc quyền và ghi receipt. File có sẵn không bị ghi đè.
7. Lượt gọi được ghi vào ledger **trước** transport. Timeout, HTTP lỗi, WAV lỗi hoặc lỗi receipt đều không tự retry; số lần gọi vẫn giữ. Nếu WAV đã lưu nhưng lỗi receipt, giữ file để recovery.

### Kiểm thử không dùng Azure

`local-smoke.mjs` tạo test tone hai giây, gửi SSML tới HTTP mock ở loopback, nhận WAV trả về theo nhiều chunk và chạy chính bộ lưu/kiểm tra trên. Đây là âm kiểm thử cục bộ, **không phải giọng nói/Nam Minh**.

| Kiểm tra | Kết quả |
|---|---|
| Local HTTP POST → binary → ghi đĩa | PASS; 1 HTTP request chỉ tới loopback |
| WAV | PCM s16le, 48.000 Hz, mono, 16-bit |
| Dung lượng / thời lượng | 192.044 bytes / 2,000 giây |
| FFmpeg full decode / ffprobe | PASS |
| Ghi rồi đọc lại / SHA-256 | PASS |
| SHA-256 test tone | `1256c9ef3fd17c1f401fbe31e4d25ca5849f56df85b325498574791cf3839b47` |
| REST URL/headers/SSML, HTTP 429 không retry | PASS với fetch mock; không liên hệ Azure |
| Tests pipeline | **20/20 PASS** |
| TypeScript | PASS |
| Tests review / voice / Azure audition hiện có | 5/5 + 6/6 + 4/4 PASS; đây là unit tests offline |

Các test gồm RIFF có metadata odd-length, response HTML/truncated/sai PCM, không ghi đè file tốt, budget/hash/cost guards, thiếu authorization/credential, giữ nguyên lượt HOOK, lỗi nhận file vẫn giữ attempt, bảo toàn reservation có sẵn và importer Python không công bố WAV hỏng. Importer Python cũ được sửa để kiểm tra trước khi lưu; import file không đủ bằng chứng nguồn chỉ có trạng thái `WAV_DECODED_PROVENANCE_PENDING`, không tự nhận là Azure đã xác minh.

### Phân biệt đã chuẩn bị với đã kiểm chứng live

Hiện `SPEECH_KEY` và `SPEECH_BEARER_TOKEN` đều không có trong môi trường chạy; chỉ kiểm tra sự tồn tại, không đọc/in giá trị secret. Phiên Speech Studio đăng nhập không tự cấp credential REST cho process.

**REST live authentication và Azure network transport: NOT TESTED.** Không thể dùng kiểm thử HTTP cục bộ để chứng nhận quyền truy cập tài nguyên Azure. Credential phải được runner nạp qua secret/environment bảo mật; không dán chat, không truyền qua command-line argument, không lưu trong Git/.env của repo. Không tạo app registration, resource, subscription hay quyền cloud mới.

Policy đi kèm có `liveSynthesisAllowed: false`. Đã thử CLI với policy khóa: dừng trước transport, attempts không đổi. Lượt sản xuất tương lai cần phê duyệt riêng và policy có hash brief, scene, expiry, budget và attempt cap; HOOK cũ không thể được gọi lại theo cap 1. `NODE_USE_ENV_PROXY=1` trên Node 24.5+ dùng proxy do môi trường cung cấp; không tắt xác minh TLS.

## 3. Remotion / Chrome: PASS ở phạm vi khởi động

Lỗi đã quan sát trước đó: proxy CONNECT timeout 5 giây trong downloader mặc định. Không có Chrome tương thích sẵn trong các vị trí chuẩn. Đã tải **Chrome Headless Shell 157.0.8080.0** (đúng tested version của Remotion 4.0.535) từ CDN chính thức Google với connect timeout 30 giây; không thay renderer hoặc sửa file Video 01/02.

- URL: `https://storage.googleapis.com/chrome-for-testing-public/157.0.8080.0/linux64/chrome-headless-shell-linux64.zip`
- Archive SHA-256: `4d033a390c5b0532dfacd1fca23b0a0b29342c8b82d89cf29a04be52844756ee`.
- MD5 so với header Google: `b27dffa084e6a1fb4e695ce5b7407fe8`.
- Browser nằm trong `.cache/marketing03/`, không commit binary.
- `--version` hoạt động; không có thư viện thiếu được ldd báo.
- `ensureBrowser({browserExecutable})` và `getCompositions()` chạy thực tế, dùng cấu hình browserExecutable được Remotion hỗ trợ.

| Entry hiện có | Composition đọc được | Metadata |
|---|---|---|
| `src/index.tsx` | EnglishJourney | 1080×1920, 30fps, 900 frames |
| `src/marketing02-index.tsx` | EnglishJourneyMarketing02 | 1080×1920, 30fps, 2250 frames (default props) |

Không gọi renderMedia/renderStill; **0 frame xuất ra, không render Video 03**. Việc enumerate composition không chứng nhận render MP4 hoàn chỉnh, assets/timeline tương lai hay subjective audio QA.

## 4. Lịch sử Azure và chi phí

| Cảnh | Ký tự | Lượt đã gọi từ trước | Lượt mới trong nhiệm vụ này | Phí tham chiếu có thể đã phát sinh |
|---|---:|---:|---:|---:|
| HOOK | 61 | 1 | 0 | 0,000915 USD |
| PROBLEM | 148 | 0 | 0 | 0 |
| SOLUTION | 131 | 0 | 0 | 0 |
| DEMO | 216 | 0 | 0 | 0 |
| BENEFIT | 176 | 0 | 0 | 0 |
| CTA | 114 | 0 | 0 | 0 |
| **Tổng** | **846** | **1** | **0** | **0,000915 USD** |

Ước tính theo 15 USD/triệu ký tự trong checkpoint, trước thuế/phí; không phải invoice Azure. Không reset bộ đếm, không xóa log cũ.

## 5. Quyết định và điều kiện tiếp tục

- **READY cho xử lý WAV cục bộ và khởi động Remotion.** Có WAV kiểm thử thật và báo cáo decode/hash.
- **NOT READY cho tổng hợp/sản xuất live:** chưa khôi phục được HOOK và chưa có credential REST bảo mật để xác minh quyền truy cập.
- Chưa đề nghị thực hiện lượt HOOK bổ sung khi điều kiện credential/transport live còn thiếu. Sau khi môi trường nhận audio và xác thực an toàn sẵn sàng, nếu WAV cũ vẫn không thể khôi phục, mới trình chủ dự án phê duyệt riêng một lượt HOOK bổ sung. Không tự thực hiện.
- Kịch bản/storyboard vẫn khóa. Không merge main, không đăng TikTok, không đánh dấu video hoàn thành hoặc được duyệt xuất bản.

## 6. Chạy lại kiểm tra an toàn

Trong `projects/english-journey-video/`:

```
npm run azure:marketing03:preflight
npm run test:marketing03:pipeline
npm run check:marketing03:audio
npm run setup:marketing03:browser
npm run check:marketing03:remotion
```

Nếu thiếu browser trong môi trường mới: `npm run setup:marketing03:browser -- --install` tải binary vendor miễn phí đã pin hash. Kiểm thử audio tạo thư mục run riêng, không ghi đè kết quả trước. `node scripts/marketing03/direct-audio.mjs --init-ledger` chỉ khởi tạo từ checkpoint nếu runtime chưa tồn tại; nếu có thì giữ nguyên. Các lệnh trên không gọi Azure TTS hoặc render Video 03.

Nguồn kỹ thuật:
- Microsoft REST endpoint, auth, SSML và WAV format: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech
- Remotion browserExecutable: https://www.remotion.dev/docs/options/browser-executable
- Remotion getCompositions: https://www.remotion.dev/docs/renderer/get-compositions
- Node proxy môi trường: https://nodejs.org/download/release/v24.17.0/docs/api/http.html
