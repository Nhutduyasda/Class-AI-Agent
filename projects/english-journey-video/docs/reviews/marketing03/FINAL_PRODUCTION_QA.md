# English Journey Marketing Video 03 V1.1 — Báo cáo bàn giao

**Đã render MP4 thật; technical QA PASS, chờ bạn xem/nghe và duyệt.** Không merge hoặc đăng TikTok. Không gọi Azure trong Work.

## Thành phẩm

- File: `English-Journey-Marketing-03-V1.1-NamMinh.mp4`
- 1080 × 1920; 30 FPS; 1.990 frame; H.264 + AAC stereo 48 kHz, yuvj420p (8-bit 4:2:0 full range).
- Timeline: 66,333 giây; thời lượng container ffprobe: 66,347 giây, gồm padding AAC. Dung lượng: 6,849,779 byte.
- SHA-256: `5eaa05da32fd8592bcbab287ce9e622139156915e7dca0ed313083d7258cadf2`.
- Có motion graphics, giọng Nam Minh, nhạc nền/SFX gốc và phụ đề đốt vào hình; kèm SRT/VTT. Tất cả sáu WAV gốc được giữ nguyên.

## Xác minh audio đầu vào

ZIP do bạn cung cấp có đủ sáu WAV PCM 48 kHz, mono, 16-bit. SHA-256 từng WAV khớp manifest và receipt; decode toàn bộ bằng FFmpeg PASS. Hash kịch bản trong manifest khớp JSON đã khóa; textSha256 trong từng receipt và text ledger khớp 100% từng lời thoại gốc. Source ghi Azure REST Standard S0, vi-VN-NamMinhNeural, southeastasia, english-journey-namminh, +0%, pitch default.

Đây là nguồn do chủ dự án cung cấp, đối chiếu hash và hồ sơ đi kèm; không phải chứng thực có chữ ký từ server Azure. Không dùng Piper hoặc tạo giọng khác.

Giọng thô tổng cộng 59,8375 giây. Chỉ normalize gain và thêm khoảng nghỉ/hold cuối cảnh; không cắt âm tiết, tăng tốc hoặc đổi pitch. Ngữ điệu sẵn có trong WAV được giữ nguyên.

## Lời thoại, phụ đề và timing

Kịch bản/storyboard V1.1 giữ nguyên. Các trang phụ đề ghép lại khớp từng đoạn approved JSON, gồm dấu tiếng Việt và hai câu tiếng Anh. Phụ đề dùng endpoints cụm lời từ faster-whisper small chạy cục bộ; số lexical tokens trong sáu quan sát khớp số token approved. Không tạo word-level timestamps giả, không karaoke nội suy.

ASR có các nhận dạng thay thế như ChatGPT → “Chá”, went → “quen” và một số dấu tiếng Việt. Chữ trên phụ đề luôn lấy từ kịch bản; bản ASR gốc có trong gói evidence. Những nhận dạng này **không tự chứng minh WAV nói sai** và cũng không chứng minh phát âm đúng. Việc nghe phát âm ChatGPT, Error Log, go/went và độ sát phụ đề vẫn cần bạn kiểm tra.

## Technical QA thực chạy

| Kiểm tra | Kết quả |
|---|---|
| 6 WAV / hash / receipt text / ledger | PASS |
| Unit tests auth + pipeline + review + production | 38/38 PASS |
| TypeScript typecheck / git diff whitespace | PASS |
| Narration exact-copy theo receipt; caption exact-copy | PASS |
| Thứ tự 6 cảnh, ranh giới liên tục, không cắt WAV | PASS |
| Subtitle monotonic, không overlap, nằm trong cảnh/video | PASS |
| ffprobe định dạng thực tế | PASS |
| FFmpeg decode toàn bộ MP4 | PASS |
| AAC so với mix ở đầu và cuối | Lag đo được 0 ms; tương quan >0,9999 |
| Loudness MP4 | −16,01 LUFS integrated |
| True peak MP4 | −2,45 dBTP, không clipping |
| Voice / music stems | Khoảng −16,00 / −36,13 LUFS; nhạc có ducking |
| Công cụ review:prepare trong repository | PASS; timeline và probe không có blocker |
| Ảnh trích xuất từ MP4 thật | 11 PNG + contact sheet; thêm review JPEG |
| Nghe trực tiếp và xem toàn bộ chuyển động | BLOCKED — môi trường không có khả năng review nghe/video-native |

Ảnh đã xem: frame 0, 2,5s, từng cảnh, DEMO câu sai/đúng và CTA cuối. Chữ đọc được trong các ảnh đã kiểm tra, không thấy clipping; frame đầu nêu vấn đề; demo đúng go → went, nhãn MINH HỌA rõ; Error Log do người học tự lưu/gửi; CTA duy nhất là bình luận BẮT ĐẦU. Câu đúng giữ khoảng 9 giây. Không suy ra chất lượng cảm xúc/retention từ ảnh hoặc metadata.

## License / nguồn tài nguyên

Nhạc và SFX dùng lại bộ tổng hợp sine/noise gốc của dự án (`scripts/v2/build.py`), không sample bài hát ngoài. Hình dựng bằng code Remotion/SVG/text, không stock hoặc ảnh ChatGPT giả. Font DejaVu Sans kèm notice Bitstream Vera/DejaVu cho phép dùng thương mại. Manifest nguồn nằm trong `assets/marketing-video-03-license-manifest.json`. Không dùng SeeCut.

## Ledger và chi phí

| Cảnh | Lượt lịch sử trước Windows | Lượt Windows đã nhập | Lượt mới trong Work |
|---|---:|---:|---:|
| HOOK | 1 | 1 | 0 |
| PROBLEM | 0 | 1 | 0 |
| SOLUTION | 0 | 1 | 0 |
| DEMO | 0 | 1 | 0 |
| BENEFIT | 0 | 1 | 0 |
| CTA | 0 | 1 | 0 |

Tổng đã ghi: **7 lượt**, gồm HOOK cũ thất lạc và sáu lượt Windows. Chi phí tham chiếu Windows: **0,012690 USD**; tổng cả lịch sử: **0,013605 USD**, dưới 0,05 USD trước thuế/phí. Chi phí thêm trong Work: **0 USD**. Chưa đối chiếu hóa đơn Azure. Ledger checkpoint cũ giữ nguyên byte; audit nhập Windows nằm ở file riêng, không reset lịch sử. File raw ledger có vài field recovery cũ (ví dụ decode BLOCKED) đã lỗi thời; trạng thái audio hiện tại dựa trên kiểm tra WAV mới và hash, không dựa vào field đó.

## File kèm và tái tạo

Gói bàn giao gồm sáu WAV gốc, voiceover/mix/music/SFX WAV, SRT/VTT, timeline, manifest, ASR observations, QA JSON, ảnh MP4 thật, license và source mới. Source Remotion/builder/QA được lưu trên nhánh Video 03; Video 01/02 không sửa. Hướng dẫn tái render ở `scripts/marketing03/README-production.md`. Không cần key hoặc gọi Azure để render lại từ audio đã nhập.

## Bạn cần duyệt

Nghe toàn bộ MP4 để đánh giá giọng có tự nhiên/nhất quán không, phát âm câu tiếng Anh và ChatGPT/Error Log, nhịp dựng, độ sát phụ đề và cân bằng nhạc. **Subjective audio QA BLOCKED; video chưa được duyệt xuất bản.**
