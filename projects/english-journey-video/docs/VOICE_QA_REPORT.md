# Lesson 15 — QA bản có giọng đọc

**Trạng thái: KỸ THUẬT ĐẠT; KIỂM TRA NGHE TRỰC TIẾP CHƯA HOÀN TẤT.**

MP4 đã được render thật và có lời nói được tổng hợp thật. Phiên Agent không hỗ trợ audio input: khi thử đưa MP3 vào, hệ thống trả về “audio content omitted because you do not support audio input”. Vì vậy báo cáo này không khẳng định Agent đã nghe, không đánh dấu phát âm/tính tự nhiên là PASS, và không kết luận hoàn thành toàn bộ điều kiện nghiệm thu của bạn.

## Thông số đo trên file cuối

| Hạng mục | Kết quả |
| --- | --- |
| Video | 1080×1920, H.264, yuv420p, 30/1 FPS |
| Số khung hình giải mã | 1247 |
| Thời lượng hình/timeline | 41.566667 giây |
| Thời lượng MP4/container | 41.579000 giây |
| Kích thước file | 2752869 byte |
| Audio | AAC, 48000 Hz, 2 kênh |
| Loudness toàn bộ MP4 | -15.96 LUFS |
| True peak | -4.51 dBTP — không clipping |
| So khớp sóng âm nguồn ↔ MP4 | 0.99998451 |
| Lệch thời gian khi ghép MP4 | 0.0 ms |
| Timestamps lời nói | 86 từ, 22 cụm phụ đề |

Chênh lệch nhỏ giữa container và timeline là phần đệm AAC, nằm trong dung sai 50 ms. Từ cuối kết thúc ở 40.449 giây, trước khung hình cuối; không bị cắt âm tiết cuối. Toàn bộ MP4 đã giải mã bằng FFmpeg không lỗi.

## Giọng và nội dung

- Tiếng Việt: `vi-VN-HoaiMyNeural`, tốc độ -5%, qua edge-tts 7.3.1.
- Từ mẫu tiếng Anh: `en-US-JennyNeural`, -5%.
- Câu tiếng Anh sửa đúng: `en-US-JennyNeural`, -20% để người học theo dõi dễ hơn.
- Tạo 8 đoạn audio theo cảnh; giữ toàn bộ PCM mỗi đoạn, thêm khoảng nghỉ ngắn, không cắt/ép nhanh để khớp thời lượng.
- Giải thích 2 nhóm lỗi: chính tả và từ nối; phần AFTER nói rõ thời gian ở đầu câu và ý bổ sung về bữa tối.
- Giữ nguyên BEFORE: `After work I went to the supermarke bought food yesteday`
- Giữ nguyên AFTER: `After work yesterday, I went to the supermarket and bought food for dinner.`
- Không đọc lỗi chính tả BEFORE thành từ vựng hợp lệ, không bịa giao diện ChatGPT, không thêm điểm TOEIC hay cam kết học nhanh.

## Timeline từ audio thật

| Cảnh | Bắt đầu | Kết thúc |
| --- | --- | --- |
| hook | 0.000s | 3.767s |
| before | 3.767s | 9.400s |
| teach | 9.400s | 20.133s |
| after | 20.133s | 34.633s |
| cta | 34.633s | 41.567s |

Mọi scene endpoint được suy ra từ số mẫu PCM rồi làm tròn lên khung hình. Kiểm tra tự động xác nhận cảnh sau không bắt đầu trước khi audio của cảnh trước kết thúc. Phụ đề/active-word dùng WordBoundary do TTS trả về, không chia đều thời gian giả. Sidecar SRT/VTT và chữ trong Remotion lấy cùng một danh sách cụm từ.

## Hình ảnh, phụ đề và mã nguồn

- Đã xem các PNG trích từ MP4 cuối: hook, teach, câu tiếng Anh AFTER, từ cuối CTA, và khung hình cuối.
- Chữ Việt có dấu, font có đủ glyph; không thấy chữ/card bị cắt hoặc chồng lên nhau trong các khung kiểm tra.
- Giữ nguyên nền xanh đậm/màu mint, bố cục 5 cảnh; phụ đề trong band y=1280, chừa right rail và đáy TikTok.
- Các frame phụ đề kiểm tra có đúng từ đang được tô sáng theo timestamps.
- TypeScript: đạt. Sáu regression tests: đạt, gồm phát hiện cảnh cắt audio, mất từ phụ đề và thay đổi câu tiếng Anh đã duyệt.
- Skill `voiceover-production` đã tạo, đọc áp dụng và chạy validator đạt.
- Module TTS có protocol thay provider; chỉ Edge được bật. Azure/ElevenLabs chưa triển khai và không được gọi.
- SHA-256 của plan/brief chống render nhầm audio hoặc subtitle cũ; nguồn audio/timestamps được cache.
- Chỉ sửa trong `projects/english-journey-video/`; không merge main, không đăng TikTok, không dùng dịch vụ trả phí hay tạo tài khoản.

## Kiểm tra nhận dạng độc lập

Kết quả của Whisper local sẽ được liệt kê bên dưới từ audio giải mã của MP4 cuối. Không đưa transcript mong muốn làm prompt cho recognizer. ASR là bằng chứng máy về khả năng nhận dạng lời nói, không thay thế nghe trực tiếp để đánh giá phát âm và độ tự nhiên.

Mô hình: Whisper `small`, chạy local CPU. Các đoạn nhận dạng từ **MP4 cuối**:

| Đoạn | Kết quả máy nhận dạng |
| --- | --- |
| hook | Tôi từng viết sai câu tiếng Anh đơn giản này. |
| before | Đây là câu mình viết ở bài 15. Bạn thấy lỗi ở đâu? |
| teach-vi | Sửa hai lỗi chính tả, rồi thêm từ nối hai hành động. |
| teach-en | supermarket yesterday and |
| after-intro | Đưa thời gian lên đầu câu. Câu sửa là... |
| after-en | After work yesterday, I went to the supermarket and bought food for dinner. |
| after-note | Mình thêm ý, mua thức ăn cho bữa tối. |
| cta | Viết sai, hiểu lỗi, rồi mình viết lại. Mỗi lần sửa là một lần luyện tập. |

Nhận đúng nội dung các đoạn sau khi rút gọn hai cụm Việt dễ nhầm. ASR ghi “bài 15” thay cho “bài mười lăm” và đổi một số dấu câu; đây là khác biệt biểu diễn, không phải thay đổi thông tin. Câu tiếng Anh sửa được nhận đúng toàn bộ. Vẫn chưa dùng kết quả này để đánh dấu nghe/phát âm là PASS.

## Bàn giao và bước nghiệm thu còn thiếu

Video: `out/lesson15-writing-retry-voice.mp4`. Audio riêng: WAV/MP3 cùng tên. Transcript, SRT/VTT, JSON word timestamps và báo cáo kỹ thuật đi kèm. Lệnh chạy lại trong README.

**Còn thiếu:** người có thể nghe cần mở toàn bộ MP4 để xác nhận phát âm tiếng Việt/tiếng Anh, nhịp nghỉ và độ tự nhiên. Không đăng hoặc tự coi toàn bộ QA là đạt trước khi bước này được xác nhận.
