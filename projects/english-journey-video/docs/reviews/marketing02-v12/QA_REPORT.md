# English Journey Marketing Video 02 V1.2 — QA

Trạng thái: **MP4 đã render, TECHNICAL PASS; chờ chủ dự án nghe và duyệt thành phẩm.**

File: `English-Journey-Marketing-02-V1.2-NamMinh.mp4` — 3,639,697 bytes.
Thời lượng container **60.181s**; hình ảnh 1.805 frame = 60,1667s (AAC/container thêm khoảng 14ms). 1080×1920, 30fps, H.264/yuv420p, AAC stereo 48kHz.
SHA-256: `b6f7b11110e0a73fd76578f40e658a5785bbdb96996aea39aab73f67a0ca48fd`.

## Thay đổi và bảo toàn

- Thay giọng Piper bị từ chối bằng **Azure Speech Standard S0 `vi-VN-NamMinhNeural`** trên resource có sẵn `english-journey-namminh`, Southeast Asia. Mặc định rate +0%, pitch mặc định; không EQ làm đổi âm sắc, không time stretch, không giọng khác ở câu tiếng Anh.
- HOOK khôi phục đúng một lần; PROBLEM, SOLUTION, BENEFIT, CTA mỗi đoạn một lần. **5 yêu cầu mới**, không retry. DEMO tái sử dụng nguyên bytes đã xác minh, không tổng hợp lại.
- 735 ký tự kịch bản giữ nguyên. Đầu vào SSML và toàn bộ chữ phụ đề khớp canonical JSON. Kiểm tra này không phải chứng nhận mọi âm phát ra chính xác.
- `src/Marketing02.tsx` giữ nguyên byte so với HEAD `60957b9912e6f19087126ac7b6a4d84eef4e1b60`. Dùng cùng Remotion composition; chỉ thay timeline/audio input. Giữ nguyên demo improve, nhãn MINH HỌA, phản hồi câu đúng, lưu từ thủ công và CTA BẮT ĐẦU.
- Video cũ không đổi: SHA-256 `eec37056e1a8299eb27ec475c5856e3b259f9d3ff45b25f8ee45d37180abbe8c`. Không đụng Video 01; không merge, không đăng TikTok.

## Thời gian theo audio

| Cảnh | Khoảng hình (giây) | WAV gốc (giây) |
|---|---|---|
| HOOK | 0.000–6.867 | 6.0625 |
| PROBLEM | 6.867–16.600 | 8.9125 |
| SOLUTION | 16.600–25.467 | 8.0500 |
| DEMO | 25.467–41.600 | 15.3250 |
| BENEFIT | 41.600–51.267 | 8.8500 |
| CTA | 51.267–60.167 | 6.7750 |

WAV Azure gốc đều mono PCM s16le **24kHz**, không phải 48kHz như kế hoạch cũ. Giữ nguyên bản gốc và resample sang 48kHz cho mix. Normalize từng đoạn cùng mục tiêu -17 LUFS mono; master stereo khoảng -16 LUFS. Giữ nguyên thuật toán nhạc dự án 90 BPM và SFX, căn lại theo scene và mốc kiểm tra DEMO. Nhạc duck theo RMS giọng.

Phụ đề 27 phrase: biên thời gian lấy từ word observations của local faster-whisper small trên chính WAV, không chia đều thời gian. Chữ ASR sai được giữ trong evidence; màn hình luôn dùng đúng lời thoại được duyệt. Không tuyên bố word karaoke hoặc alignment thủ công đã nghe xác minh. Chú ý nghe lại tên ChatGPT và tiếng Anh: ASR vi có thay thế như “chắc/chát”, “impo” và phiên âm câu tiếng Anh; chưa thể kết luận đây là lỗi phát âm hay lỗi ASR. Không tự gọi Azure thêm để sửa.

## Kiểm tra đã chạy

- TypeScript: PASS. `test:review` 5/5, `test:voice` 6/6, `test:azure:marketing02` 4/4.
- QA V1.2: ffprobe, full audio/video decode, hash/input/caption copy, sáu cảnh, mọi cue nằm trong cảnh, không overlap, SRT/VTT phủ đúng chữ: PASS.
- Sáu WAV gốc giải mã đầy đủ, checksum khớp ledger. DEMO checksum `6bc9bca6f5ca8a8e7e86248a4d9b45057a3491f5e1b5b9ce0f68eafacba72cc4`.
- MP4 measured integrated **-16.01 LUFS**, true peak **-2.57 dBTP**; không clipping. Voice stem -16,00 LUFS; music -35,78 LUFS (chênh 19,78 LU).
- `review:prepare` trên MP4 mới và MP4 cũ: technical PASS cả hai; 11 proof ảnh candidate trích video. Xuất thêm 10 PNG 1080×1920 trong exported-proofs.
- Đã xem contact sheet và ảnh DEMO/CTA/HOOK trích MP4: chữ và bố cục đúng, không cắt chữ thấy được ở các mốc kiểm tra. Đầu video hiện ngay HỌC TRƯỚC / QUÊN SAU. Pixel change lấy tại năm khoảng trong MP4 xác nhận chuyển động hiện hữu; không chứng nhận cảm xúc dựng bằng phép đo này.

## Những mục chưa thể tự duyệt

**BLOCKED: nghe/xem liên tục toàn bộ thành phẩm bằng công cụ nghe nhìn.** Không tuyên bố giọng tự nhiên, phát âm tiếng Anh, nhịp nghỉ hoặc độ giống Video 01 đạt chuẩn chỉ nhờ metadata, ASR hoặc ảnh. Voice identity/provider/config thống nhất sáu cảnh; đánh giá cảm nhận cần chủ dự án nghe video đính kèm. Hai mẫu đã duyệt không bị yêu cầu duyệt lại; đây là duyệt bản thành phẩm trước đăng.

## Quyền tài nguyên

Azure prebuilt neural paid-tier theo hồ sơ xác minh trong `docs/MARKETING_VIDEO_VOICE_PROFILE.md` và `docs/reviews/marketing02-azure/` (nếu có), Microsoft Product Terms / Speech supported voices. Không dùng Edge consumer hay Piper cho V1.2. Không tạo resource hoặc chấp nhận điều khoản mới trong lượt này. Nhạc/SFX tạo bằng thuật toán của dự án, không sample nhạc ngoài; hình React/SVG gốc, font DejaVu theo `public/fonts/LICENSE.txt`. Không sao chép SeeCut.

## Chi phí

Tham chiếu $15 / 1.000.000 ký tự, trước thuế/phí; nguồn giá chính thức đã xác minh trong phiên. VND chỉ quy đổi tham khảo 26.090 VND/USD, không phải tỷ giá thanh toán.

| Lượt | Ký tự | USD |
|---|---:|---:|
| Hai mẫu trước (theo hồ sơ, chưa đối soát invoice) | 270 | 0,004050 |
| HOOK khôi phục, 1 lần | 82 | 0,001230 |
| PROBLEM, 1 lần | 120 | 0,001800 |
| SOLUTION, 1 lần | 120 | 0,001800 |
| BENEFIT, 1 lần | 126 | 0,001890 |
| CTA, 1 lần | 99 | 0,001485 |
| **Mới trong lượt này** | **547** | **0,008205** |
| **Tất cả lượt đã biết** | **817** | **0,012255** |

Tương đương lượt mới khoảng **214 VND**, tổng đã biết khoảng **320 VND**, dưới ngân sách 0,05 USD. DEMO không tính phí lần hai. Đây là ước tính usage, không phải invoice Azure; không thể xác nhận usage ngoài những lượt có hồ sơ. Thuế, tỷ giá ngân hàng, phí thẻ/làm tròn và hoạt động khác trên subscription có thể làm khác hóa đơn. Hạn mức hội thoại không phải hard cap của Azure; không gọi thêm sau khi hoàn tất 5 lượt.

## Render lại không phát sinh TTS

Khôi phục các file audio/ASR/ledger trong gói bàn giao vào `out/marketing02/azure-v12/`. Node dependencies qua `npm ci`; Python theo `scripts/marketing02/requirements-v12.txt`. Cần FFmpeg/ffprobe và Chrome của Remotion.

```
npm run build:marketing02:v12
npm run proofs:marketing02:v12
npm run render:marketing02:v12
npm run qa:marketing02:v12
```

Các lệnh V1.2 chỉ dựng offline từ WAV có sẵn; không gọi Azure. Nếu cần tạo lại ASR: `python3 scripts/marketing02/align-v12.py --model /absolute/existing/faster-whisper-small` (local model, không download). Không chạy builder Piper cũ cho bản V1.2.
