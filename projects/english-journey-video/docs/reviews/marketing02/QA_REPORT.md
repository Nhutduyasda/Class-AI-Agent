# English Journey Marketing Video 02 — bản xem trước

**Trạng thái: có MP4 thực tế; chưa duyệt đăng.** Bản dựng dùng giọng cục bộ miễn phí theo lựa chọn của chủ dự án trong Work. Không phải Nam Minh.

## Kết quả và phạm vi

- Timeline hình: 62,533 giây, 1.876 khung hình. Sáu cảnh HOOK → PROBLEM → SOLUTION → DEMO → BENEFIT → CTA.
- Bản xuất: 1080×1920, 30 FPS, H.264/AAC stereo 48 kHz. Kết quả giải mã toàn bộ, loudness và hash trong `technical-qa.json` kèm gói bàn giao.
- Lời thoại nguồn và phụ đề khớp chính xác sáu đoạn đã khóa; không rút gọn hay thêm câu. Kiểm tra này xác minh văn bản đầu vào, không chứng nhận TTS đã phát âm mọi âm tiết đúng.
- Nhạc/SFX tổng hợp gốc từ DSP hiện có. Mix khoảng −16 LUFS; nhạc khoảng −38,6 LUFS, thấp hơn voice khoảng 22,6 LU. Không time-stretch voice.
- Review unit tests: 5/5; voice timing tests: 6/6; TypeScript: đạt. Review preparation chạy với MP4 và brief Video 02, không dùng kết quả Video 01.
- Không sửa Video 01, không dùng SeeCut, không API trả phí, không đăng TikTok, không merge main.

## Kiểm tra hình ảnh thực tế

Đã xem contact sheet từ các PNG dựng: frame mở đầu, 2,5 giây, giữa cả sáu cảnh và khung cuối. Chữ tiếng Việt đọc được, xanh đậm/mint nhất quán, không thấy cắt chữ trên các khung đã kiểm tra. Phần quan trọng nằm trong x96–916, phía trên y1580, chừa đáy cho giao diện TikTok. Ảnh trích từ MP4 trong `review/candidate/` là bằng chứng file xuất.

Hook có học từ vựng/quên sau từ frame 0. Danh sách từ mờ dần thể hiện minh họa, không phải số liệu hiệu quả học tập. Demo ghi MINH HỌA, dùng đúng improve = cải thiện và `I want to improve my English.`; chỉ xác nhận câu đúng. Cảnh benefit ghi rõ người học tự lưu danh sách và gửi lại ở buổi sau. CTA chỉ yêu cầu bình luận “BẮT ĐẦU”.

## Những mục chưa đạt nghiệm thu chủ quan

**Chưa nghe/xem toàn bộ video bằng công cụ nghe nhìn.** Không chấm PASS về cảm xúc, nhịp nói, sức thuyết phục, độ tự nhiên hay cân bằng nhạc trên điện thoại.

ASR Whisper small tiếng Việt được dùng như kiểm tra hỗ trợ. Bản chép nhận dạng có nhiều sai khác (ví dụ hôm nay/nghĩa/ôn); không thể xác định từ ASR xem đó là lỗi nhận dạng hay phát âm TTS. Sau kiểm tra đầu, đã thêm lexicon phát âm AI/ChatGPT và chữ in hoa BẮT ĐẦU, đồng thời dùng giọng tiếng Anh cục bộ cho improve và câu ví dụ. Các từ viết trong phụ đề/brief không đổi. Cần người nghe kiểm tra toàn bộ, đặc biệt hook 0–6s, tên ChatGPT, hai đoạn tiếng Anh và CTA cuối. Không tuyên bố cải thiện cảm xúc hoặc bản mới thắng A/B; không có hai lượt đánh giá nghe nhìn đảo thứ tự.

Phụ đề đồng bộ ở cấp **cụm audio thực đo**. Không có word-level alignment đáng tin cậy từ model này nên không tạo timestamp giả hoặc karaoke từng từ. Cần duyệt độ khớp cụm khi xem.

## Quyền sử dụng

Nam Minh qua Edge không được dùng do quyền thương mại chưa xác minh. Giọng Piper thay thế có thông tin model/dataset/attribution trong license manifest. Dataset tiếng Việt CC BY 4.0, kho model khai báo MIT; model card cũng nêu fine-tune từ lessac. **Chuỗi quyền huấn luyện chưa được xác minh đầy đủ để chứng nhận dùng thương mại.** Giọng tiếng Anh ljspeech được huấn luyện từ đầu với dataset public domain. Nhạc/SFX/visual là phần gốc của dự án; font DejaVu có giấy phép trong gói.

Trước đăng cần: nghe duyệt giọng và tiếng Anh; xác nhận phụ đề/nhạc trên điện thoại; chốt quyền giọng hoặc thay bằng bản đọc có quyền sử dụng rõ ràng; chủ dự án duyệt bản cuối. Đây là bản xem trước có đầy đủ hình/âm/chuyển động, chưa phải bản được chứng nhận sẵn sàng đăng.

## Kết quả file xuất cuối

Thời lượng container: 62.549000 giây; full decode PASS; AAC 48 kHz stereo; integrated loudness -16.01 LUFS; true peak -4.15 dBTP. SHA-256: `eec37056e1a8299eb27ec475c5856e3b259f9d3ff45b25f8ee45d37180abbe8c`.
