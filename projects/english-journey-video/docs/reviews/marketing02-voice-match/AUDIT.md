# Marketing Video 02 — Voice continuity audit (15/10/2026)

**VOICE RIGHTS / PROVIDER BLOCKED. Chưa tạo hai mẫu mới; chưa render V1.2.**

Chủ dự án chấp nhận nội dung/hình Video 02 hiện tại nhưng từ chối giọng Piper. Yêu cầu mới thay thế lựa chọn dùng giọng miễn phí ở lần trước. Không dùng Piper/giọng khác, đổi lời thoại, hình ảnh hoặc thông điệp để né trở ngại.

## Đã đối chiếu với file thật

Đã lấy đúng `english-journey-marketing-video-01-nam-minh.mp4` từ bản bàn giao trước. SHA-256 `8e56d06c8c0c4b50fa78a318414568c6d93c886f5a841f7b8c528b8c2c91af7a` trùng hash baseline Nam Minh đã ghi trong báo cáo dự án. Đây là file thật, không tái tạo TTS. Đã kiểm tra thêm voice stem và MP4 Video 02 đang bị từ chối, với hash/ffprobe/loudness trong evidence.json.

Hai file WAV trích 6 giây để đối chiếu **audio cũ**:
- `Video01-NamMinh-Reference-6s.wav`: trích mix từ MP4 Nam Minh gốc; có nhạc/SFX, không phải stem sạch.
- `Video02-Rejected-Piper-6s.wav`: trích stem giọng Piper đang bị từ chối; không có nhạc.

Không gọi hai file này là hai mẫu giọng mới của Video 02. Nội dung chúng khác nhau và một file có nhạc, nên không phải thử nghiệm A/B kiểm soát hoàn toàn.

## Nguyên nhân sai khác đã xác minh

| Hạng mục | Video 01 chuẩn | Video 02 bị từ chối |
|---|---|---|
| Provider/voice | Edge consumer via edge-tts; vi-VN-NamMinhNeural | Piper local; vi_VN-vais1000-medium |
| Tốc độ khai báo | +0% | length_scale=2.0; không quy đổi tương đương sang rate của Edge |
| Chia đoạn | Sáu spokenSegments; lấy WordBoundary thật | 27 cụm ngắn; caption theo thời lượng PCM từng cụm |
| Khoảng nghỉ | Khoảng đuôi >=0,35s rồi làm tròn lên grid 90 BPM | 0,12s giữa cụm; khoảng đuôi >=0,4s làm tròn lên frame |
| improve/câu tiếng Anh | Không có đúng ví dụ này trong kịch bản Video 01 | Dùng en_US-ljspeech-medium riêng cho improve và câu tiếng Anh; model card xác nhận giọng nữ |
| ChatGPT/AI/BẮT ĐẦU | Chuỗi chữ gốc chuyển cho Edge; không phonetic patch trong builder | Thay đầu vào phát âm thành chát gi pi ti/ây ai/bắt đầu; captions vẫn nguyên văn |
| Pitch/EQ | Không dịch pitch; không thấy EQ riêng cho giọng | Không dịch pitch; không thấy EQ riêng cho giọng |
| Mix loudness thực đo | MP4 -16,19 LUFS, true peak -1,47 dBTP | MP4 -16,01 LUFS, true peak -4,15 dBTP; stem -16,02 LUFS |
| Nhạc | Tổng hợp gốc, speech ducking có smoothing 20ms/280ms | Tổng hợp gốc; RMS ducking không có cùng bước smoothing; nhạc khoảng -38,62 LUFS |

Đổi model/voice là nguyên nhân kỹ thuật rõ ràng của việc mất danh tính người dẫn; thay đổi tốc độ/chia cụm và chuyển sang người đọc tiếng Anh khác cũng không giữ profile cũ. Loudness gần nhau không chứng minh âm sắc hay độ tự nhiên giống nhau. Thời lượng toàn video khác nhau cũng không chứng minh nhịp nói khác vì hai kịch bản khác nhau.

Ở lần trước, Edge commercial rights chưa rõ nên đã tạo lựa chọn miễn phí và dùng Piper sau lựa chọn của chủ dự án. Tuy nhiên, đó chỉ giải quyết việc tạo audio xem trước; nó không thỏa mục tiêu giữ cùng người dẫn và đã bị chủ dự án bác bỏ sau khi nghe.

## Nghe và phát âm

Agent chưa có công cụ thực sự nghe audio trong lượt kiểm tra này: **LISTENING BLOCKED**. Không chấm voice-match, cảm xúc, phát âm hoặc nhạc che tiếng là PASS. Phản hồi có thật từ chủ dự án: Video 02 không giống Nam Minh và thiếu tự nhiên. Các nhận định kỹ thuật trên đến từ mã nguồn, manifest và đo file, không phải giả lập việc nghe.

## Trở ngại tạo hai mẫu mới

- Repo chỉ triển khai EdgeProvider; Azure/ElevenLabs là giao diện dự kiến, chưa bật adapter trả phí.
- Không có biến cấu hình Azure Speech credentials trong môi trường được kiểm tra; không đọc/tiết lộ secret.
- Không có bằng chứng quyền xuất bản thương mại cho output Nam Minh qua Edge; cũng chưa xác minh được quyền dùng đường đó để tạo hai mẫu riêng trong điều kiện dự án này. Chưa gửi request tổng hợp mới.
- Azure liệt kê chính thức vi-VN-NamMinhNeural. Điều khoản Microsoft có quyền dùng thương mại output prebuilt neural voices cho khách hàng paid tier; điều đó không tự cấp quyền cho Edge consumer hoặc xác minh quyền của free tier. Chưa tạo resource/tài khoản, mua credit hay gọi API có phí.

Nguồn chính thức kiểm tra ngày 15/10/2026:
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
- https://www.microsoft.com/licensing/terms/en-US/productoffering/MicrosoftAzure/allprograms
- https://www.microsoft.com/licensing/terms/en-US/productoffering/MicrosoftAzureServices/EAEAS/SpecificUseRights (trang điều khoản chương trình; áp dụng đúng hợp đồng của tài khoản khi triển khai)

## Phương án mở khóa

1. **Không trả phí qua Work:** chủ dự án cung cấp hai đoạn Nam Minh đã tạo từ nguồn có quyền sử dụng, kèm nguồn/quyền dùng. Hai đoạn chính xác cần đọc đã chuẩn bị trong audition-plan.json. Không dùng dịch vụ bên thứ ba chỉ tự nhận là Nam Minh mà chưa chứng minh provider/quyền.
2. **Azure Nam Minh chính thức:** chủ dự án cho phép ngân sách riêng cho việc tạo đúng hai mẫu, cung cấp kết nối Azure Speech được cấp quyền; kiểm tra tier/hợp đồng và giá theo tài khoản/region trước request. Không kích hoạt chi phí chỉ từ báo cáo này. Cùng voice ID là điểm bắt đầu, không bảo đảm âm thanh hai dịch vụ/version tuyệt đối giống nhau; phải nghe duyệt.
3. Nếu có văn bản cấp quyền rõ cho đường Edge hiện có, kiểm tra phạm vi quyền trước khi dùng; không coi việc đã render Video 01 là bằng chứng quyền.

## Mẫu đã chuẩn bị, chưa tổng hợp

A = toàn bộ HOOK đã khóa. B = toàn bộ DEMO đã khóa, thử **cùng Nam Minh** đọc improve và câu tiếng Anh trước. Cùng +0%, pitch mặc định; không kéo giãn audio, không chuyển người đọc tiếng Anh. Đây là hai đoạn kiểm tra chất giọng/phát âm, không tuyên bố là hai danh tính giọng khác nhau. Không có audioPath giả trong plan.

Sau khi giải quyết quyền/provider: tạo A/B → gửi chủ dự án nghe → chờ duyệt → mới dựng toàn bộ voiceover và đổi tối thiểu các mốc subtitle/animation, render file V1.2 riêng. Giữ nguyên audio/video cũ và toàn bộ visual/copy đã duyệt.

Không có request tổng hợp giọng mới, chi phí mới, thay đổi source render, full voiceover, MP4 mới, merge main hay đăng TikTok trong lượt audit này.
