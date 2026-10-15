# Marketing Video 02 — QA trước đăng

**Approval:** lời thoại V1.1 đã duyệt; sản xuất và đăng TikTok vẫn **CHƯA ĐƯỢC DUYỆT**.

## Content lock
- [ ] So khớp chính xác sáu `spokenSegments` trong `briefs/marketing-video-02-approved.json` (HOOK → PROBLEM → SOLUTION → DEMO → BENEFIT → CTA).
- [ ] Không chèn thêm lời thoại hay CTA. Các khoảng thời gian chỉ là dự kiến; giọng đọc tự nhiên quyết định độ dài.
- [ ] Người lạ biết câu chuyện liên quan đến học từ vựng trước/quên sau trong 3 giây.
- [ ] Cho thấy người học chuyển từ biết nghĩa sang thực hành sử dụng, kiểm tra, lưu từ và ôn tập.

## Demo integrity
- [ ] `improve` nghĩa là cải thiện; câu `I want to improve my English.` là câu đúng.
- [ ] AI phản hồi xác nhận câu đúng, không tạo lỗi giả để minh họa sửa lỗi.
- [ ] Nếu có giao diện minh họa thì gắn `Minh họa`; tuyệt đối không giả danh ảnh chụp ChatGPT thật.
- [ ] Vocabulary Log là việc người học chủ động lưu và hỏi lại, không tự ghi nhớ xuyên chat.
- [ ] Không tuyên bố kết quả học được bảo đảm hay minh chứng người học khác khi chưa có dữ liệu.

## Media QA
- [ ] MP4 thật, H.264/AAC, 1080×1920, 30 fps; có âm thanh giọng đọc và nhạc nền hợp lệ.
- [ ] Kiểm tra video theo `npm run qa:marketing` **chỉ khi script phù hợp với Video 02**, không dùng kết quả Video 01 để chứng minh Video 02 đạt.
- [ ] Chạy `npm run test:review` và `npm run review:prepare` với manifest của Video 02 khi có đầu ra thực.
- [ ] Trích ảnh thật của 3 giây đầu, tất cả sáu cảnh và kết thúc. Người thật/AI có khả năng nghe nhìn phải đánh giá toàn bộ.
- [ ] Voice Nam Minh phát âm `improve`, `I want to improve my English`, `ChatGPT` tự nhiên, có nhịp nghỉ.
- [ ] Nhạc nền có giấy phép dùng cho video marketing; không át narration.
- [ ] Subtitle rõ trên điện thoại; tránh overlay TikTok.

## Release
- [ ] Báo cáo kỹ thuật từ MP4 thực tế.
- [ ] Ghi rõ nguồn và giấy phép của TTS/nhạc/SFX.
- [ ] Chủ dự án xem và phê duyệt bản cuối.
- [ ] Không tự đăng TikTok, merge hay chi tiền.
