# English Journey Lesson 15 V2 — QA và bàn giao

**Trạng thái: NOT APPROVED — đã render MP4 thật, đạt kiểm tra kỹ thuật; các tiêu chí nghe/cảm xúc/hiểu sau một lần xem chưa được con người xác nhận.**

## Những gì đã thay đổi so với V1

Kịch bản mới là nhật ký học từ lỗi thật: “Một câu thôi… mà mình sai mấy chỗ” → sửa hai lỗi chính tả → thêm “and” nối hai hành động → hiểu và viết lại. Bố cục mới dùng giấy ấm/bút chì/đánh dấu chữ, không sử dụng ảnh hội thoại ChatGPT giả. Đây là composition V2 riêng, không chỉ thêm nhạc lên V1.

Giọng tạm dùng Nam Minh với câu ngắn và khoảng nghỉ theo dấu câu. Đã tạo hai audition cùng hook + reveal: A Hoài My, B Nam Minh. **Chưa nghe được hai bản nên không tuyên bố B tự nhiên hơn hoặc đã khắc phục giọng robot.** Không dùng emotion tag không được provider hỗ trợ, không clone giọng người dùng.

## Tiêu chí đạt / chưa đạt

| Tiêu chí | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- |
| MP4 thật, 1080×1920, 30 FPS, H.264 + AAC | ĐẠT | ffprobe + giải mã toàn bộ 1140 khung hình |
| Hook hiện ngay; câu sai thật xuất hiện trong 3 giây đầu | ĐẠT về dựng hình | Frame 0 có headline và câu BEFORE; lời hook kết thúc khoảng 2,48s; phản ứng người xem chưa chấm |
| Kịch bản có một ý chính rõ | ĐẠT về cấu trúc | AI sửa và giải thích; mình hiểu rồi viết lại; chưa chứng nhận người lạ hiểu sau một lần xem |
| Minh họa sửa chữ và từ nối | ĐẠT về triển khai | Thêm `t`, thêm `r`; “and” rơi vào cầu nối `went`/`bought`; chime/whoosh theo mốc frame |
| English nguyên bản và câu sửa | ĐẠT về kiểm tra nội dung/hình | Hai câu giữ nguyên theo brief; lỗi ở BEFORE/cảnh sửa được đánh dấu rõ |
| Đọc câu hoàn chỉnh đủ lâu | ĐẠT | Full AFTER giữ 7.4s sau khi toàn bộ reveal kết thúc |
| Nhạc và SFX thực sự ở trong MP4 | ĐẠT kỹ thuật | Đối chiếu ba stem với waveform giải mã của final export, không chỉ kiểm tra file riêng |
| Nhạc/SFX nguyên bản | ĐẠT về nguồn | Tổng hợp bằng code project, không nhập bài hát/sample/MIDI bên ngoài; có provenance manifest |
| Phụ đề theo audio thật | ĐẠT kỹ thuật | 70 WordBoundary từ TTS; cụm nghĩa ≥1s; active word giữ timing gốc |
| Dấu Việt, vùng an toàn, không cắt chữ | ĐẠT ở các proof đã xem | Năm PNG từ MP4 cuối; glyph coverage không thiếu; chưa kiểm thử điện thoại thực tế |
| Giọng nghe tự nhiên/có cảm xúc | BLOCKED / CHƯA ĐẠT NGHIỆM THU | Agent không có audio input; chưa nghe audition/final, không được chấm bằng ASR |
| Nhạc hợp không khí, không lấn lời khi nghe | BLOCKED | Có ducking và đo mức âm; cần nghe bằng loa điện thoại/tai nghe |
| Người lạ hiểu sau một lần xem; điểm từng mục ≥4/5 | BLOCKED | Chưa có người đánh giá; không tự tạo điểm số |
| Quyền xuất bản giọng TTS | CHƯA XÁC NHẬN | Edge consumer audition là bản review; không tuyên bố giấy phép thương mại cho giọng |
| Không phát sinh phí / không tự đăng / không merge main | ĐẠT phạm vi | Không gọi paid provider, không tạo account, không thao tác TikTok/main |

## Thông số file cuối

| Hạng mục | Giá trị |
| --- | --- |
| File | `out/lesson15-writing-retry-v2.mp4` |
| Timeline hình | 38.000s, 1140 frames |
| MP4/container | 38.016000s |
| Kích thước | 1924935 byte |
| Video | 1080×1920, 30/1 FPS, h264, yuv420p |
| Audio | aac, 48000 Hz, 2 kênh |
| Loudness final | -16.01 LUFS |
| True peak final | -1.93 dBTP — không clipping |
| Voice stem | -15.95 LUFS |
| Music stem (đã duck) | -35.22 LUFS |
| Chênh voice–music tích hợp | 19.27 dB |
| Correlation final ↔ mix nguồn | 0.99998020 |
| Lệch audio khi encode | 0.0 ms |

Chênh container/timeline nhỏ là padding AAC, không cắt lời. Full decode không lỗi; blackdetect không báo khoảng đen. Ducking attack 20ms/release 280ms, tối đa 4,4dB; nhạc có fade vào 350ms, kết thúc 700ms. Không retime hay kéo giãn giọng.

Coefficient đo trực tiếp từ MP4 cuối: voice 0.99884, music 0.99830, SFX 0.99783. Ba thành phần hiện diện trong audio cuối. Mức đo không thay thế đánh giá độ dễ nghe.

## Kiểm tra câu tiếng Anh và chuyển động

BEFORE nguyên văn:

> After work I went to the supermarke bought food yesteday

AFTER nguyên văn:

> After work yesterday, I went to the supermarket and bought food for dinner.

`supermarke` → thêm `t` → `supermarket`; `yesteday` → thêm `r` → `yesterday`. `and` nối `went` (đã đi) và `bought` (đã mua). Vị trí `yesterday` ở đầu được mô tả là cách viết lại, không khẳng định đặt cuối câu luôn sai. `for dinner` được ghi rõ là ý thêm về bữa tối, không phải bắt buộc về ngữ pháp. Không bịa thêm câu tiếng Anh hoặc kết quả TOEIC.

## Timeline thực và ảnh đã xem

90 BPM, 30 FPS, 20 frames/beat; các scene kết thúc sau toàn bộ audio rồi snap lên nhịp. Không J-cut/L-cut cắt lời. Không speed-ramp giọng. Cầu nối lấy mốc từ từ “và” thật rồi căn lên beat kế tiếp.

| Cảnh | Bắt đầu | Kết thúc | Proof frame |
| --- | --- | --- | --- |
| opening | 0.000s | 7.333s | 10 |
| mistakes | 7.333s | 13.333s | 320 |
| bridge | 13.333s | 19.333s | 490 |
| fullfix | 19.333s | 29.333s | 680 |
| cta | 29.333s | 38.000s | 950 |

Đã xem năm ảnh từ **MP4 cuối** tại opening, mistakes, bridge, full fix, CTA, và contact sheet. Các chữ thêm/từ nối/câu hoàn chỉnh có đối chiếu. Đã xem pre-render stills và kiểm tra TypeScript/glyph coverage/diff whitespace. Chưa tự nhận đã xem/nghe liên tục như người dùng trên thiết bị thật.

## ASR độc lập từ final speech + music mix

Whisper `small` chạy local CPU, không cung cấp transcript làm prompt. Đây là kiểm tra máy, không phải nghe/cảm xúc:

| Đoạn | Lời dự kiến | ASR nhận dạng |
| --- | --- | --- |
| hook | Một câu thôi... mà mình sai mấy chỗ. | Một câu thôi mà mình sai mấy chỗ? |
| context | Mình viết về chuyện đi siêu thị hôm qua. | Mình viết về chuyện đi siêu thị hôm qua. |
| spelling | Hai từ sai chính tả. Nhìn nhé, mình sửa từng chữ. | 2 từ sai chính tạ. Nhìn nhé, mình sửa từng chữ. |
| connector | Rồi thêm từ nối: và. Nối đã đi với đã mua. | Rồi thêm từ nối và nối đã đi với đảm mua. |
| retry | Mình đưa hôm qua lên đầu, thêm ý mua đồ cho bữa tối. | Mình đưa hôm qua lên đầu thêm ý mua đồ cho bữa tối. |
| reveal | AI sửa và giải thích. Còn mình, phải hiểu rồi viết lại. | AI sửa và giải thích. Còn mình phải hiểu rồi viết lại. |
| question | Bạn từng sai lỗi này chưa? | Bạn từng sai lỗi này chưa? |

ASR có khác biệt ở “chính tả”/“đã mua”. Không kết luận chắc chắn đây là lỗi phát âm hay nhạc lấn lời: cần nghe thật hai đoạn này. Không dùng ASR để đánh dấu giọng tự nhiên hoặc toàn bộ lời đọc là PASS.

## Nguồn nhạc, SFX và quyền sử dụng

`assets/music-license-manifest.json` ghi nguồn code. Bed “English Journey — Paper & Progress” được tổng hợp mới bằng sine/harmonic pad/pluck, chord tones cơ bản, bass pulse và pattern deterministic. SFX là chime sine và filtered noise seed 1515. Không lấy bài hát/sample bên thứ ba nên không có license stock/receipt cần viện dẫn. Font DejaVu Sans giữ license gốc trong `public/fonts/LICENSE.txt`.

Voice là Edge TTS phục vụ review. Chưa xác minh quyền xuất bản thương mại giọng consumer Edge, không cấp thay giấy phép của provider. Nếu dùng human WAV có consent hoặc một TTS có giấy phép phù hợp đã được phép, importer/pipeline giữ cùng transcript, timing thực và xuất lại. Chưa có human WAV được gửi để ingest. Không có paid request.

## Điểm con người: chưa chấm

| Hạng mục | Điểm 1–5 |
| --- | --- |
| Hook | Chờ người xem |
| Speech | Chờ người nghe |
| Music | Chờ người nghe |
| Comprehension | Chờ xem một lượt |
| Visual | Chờ người xem |
| Mobile readability | Chờ xem trên điện thoại |

Theo `docs/V2_ACCEPTANCE.md`, mỗi mục cần ≥4/5 từ người đánh giá. Hai audition và final chưa được Agent nghe vì môi trường không hỗ trợ audio input. Vì vậy video **NOT APPROVED**, không tự đăng và không giả vờ đã đạt cảm xúc.

## Bàn giao

MP4, `v2-voice.wav`, `v2-music.wav`, `v2-sfx.wav`, `v2-mix.wav`, hai audition WAV, SRT/VTT, read-aloud script, timeline JSON, năm PNG proof, contact sheet và báo cáo. Hướng dẫn chạy lại/human-voice import trong `docs/V2_PRODUCTION.md`. Chỉ commit source/provenance trên nhánh V2.

## Hash của file được đo và kiểm tra hình

Final MP4 SHA-256: `67dee897d406b73eb51a1ee3c4252f3ddab7cd6142c16996fba41d41380463c5`

Audition A SHA-256 (đã tạo, chưa nghe): `041f89277c6057297d69bf8437c290c700d9ab35e832fa10a27b7271e0b54193`

Audition B SHA-256 (đã tạo, chưa nghe): `57502b6cc7ba28e4f162197a0bf1b40d6f3c3a68958b6084bcc68c62209422e9`
