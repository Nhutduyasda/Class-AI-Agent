# Bilingual Voice Production — mặc định cho video marketing mới

Đây là adapter mở rộng pipeline hiện có, không thay renderer hoặc di chuyển Video 01–04. Cấu hình lưu lâu dài tại `config/bilingual-voice.json`: tiếng Việt dùng **Nam Minh**, tiếng Anh dùng **Andrew**, Azure chính thức, resource `english-journey-namminh`, region `southeastasia`, WAV 48 kHz mono PCM 16-bit, rate +0%, pitch mặc định.

## Một prompt sản xuất cho video mới

1. Đọc approved JSON, giữ nguyên `spokenSegments[].spoken`. Đặt ID video mới; không dùng ID lịch sử 01–04.
2. Chạy `npm run voice:price` để cập nhật giá công khai khi snapshot đã cũ. Không phải request TTS và không cần key.
3. Chạy `npm run voice:plan -- briefs/<new-approved>.json out/<new-plan>.json`. Mặc định `multivoice`: một request mỗi cảnh. CLI chỉ lập kế hoạch, không tự gọi Azure.
4. Kiểm tra `warnings`; bổ sung metadata cho những trường hợp không rõ. Đây là metadata phát âm, không duyệt lại hoặc viết lại kịch bản. Agent có thể thêm metadata khi ngữ cảnh rõ; không được coi bộ luật nhận diện là bộ phân loại ngôn ngữ hoàn hảo.
5. Nếu prompt sản xuất đã cấp ngân sách cụ thể, tạo policy `BILINGUAL_V1` mới, ràng buộc `productionId`, `planSha256`, đúng `requestIds`, `maxRequests`, một attempt/request, `mode`, đơn giá và thời hạn. Nếu chỉ được phép code/offline, giữ `liveSynthesisAllowed: false` và xin phép riêng trước TTS. Không dùng ngân sách Video 03/04.
6. Chạy PowerShell riêng bằng `scripts/bilingual/Start-BilingualVoice.ps1 -Mode Run -Plan <plan.json> -Authorization <new-policy.json>`. Launcher kiểm tra policy offline trước, nhập key ẩn **một lần**, kiểm tra danh sách hai giọng bằng GET, rồi tổng hợp trong phạm vi được cấp. Không yêu cầu duyệt lại nội dung/chi phí đã cấp trong prompt.
7. Dùng audio thật đã xác minh để căn timing, dựng, phối nhạc, QA và bàn giao theo lệnh phía dưới. Không gọi lại TTS để sửa bố cục/phụ đề/phối nhạc.

## Metadata phát âm — không thay đổi lời thoại

Trong mỗi scene, thêm `voiceProduction.spans`, danh sách đã sắp xếp theo `start`, không chồng lấn. Offset là **UTF-16 JavaScript**, `[start,end)`, đối chiếu với chính `spoken`, không phải offset Unicode code point; `text` bắt buộc trùng nguyên văn. Không cắt giữa một từ hoặc surrogate pair.

```json
{
  "id": "demo",
  "spoken": "Mình nhờ John kiểm tra.",
  "voiceProduction": {
    "spans": [{"start": 9, "end": 13, "text": "John", "language": "en-US"}]
  }
}
```

`language` có thể là `vi-VN` để giữ tên riêng/chữ viết tắt bằng Nam Minh hoặc `en-US` để dùng Andrew. ChatGPT và AI mặc định giữ Nam Minh; Error Log và các thuật ngữ/ví dụ trong cấu hình dùng Andrew. Có thể ghi đè bằng spans. Quy tắc tự động nhận các ví dụ, thuật ngữ, một tập từ/câu tiếng Anh và mạo từ có ngữ cảnh; từ Latin chưa nhận diện sẽ chặn paid run để bổ sung metadata. Không tự coi mọi đoạn ASCII là tiếng Anh.

A trong “lớp A” giữ tiếng Việt. A/AN/THE trong danh sách hoặc sau “dùng/chọn/mạo từ” được đánh dấu là mạo từ. Câu tiếng Anh hoàn chỉnh để Andrew xử lý ngữ cảnh tự nhiên. Mạo từ độc lập mặc định dùng SSML phoneme `/ə/`, `/ən/`, `/ðə/` thay vì đọc A thành tên chữ cái. Override `phoneme` cho riêng token mạo từ có thể dùng `ə`, `ən`, `ðə`, `ði` hoặc `eɪ` khi ngữ cảnh thực sự yêu cầu. Phoneme là metadata, không thay chữ canonical. Các cách đọc thực tế vẫn cần nghe Azure để nghiệm thu.

## SSML, chi phí và fallback

SSML dùng nhiều `<voice>` trong một `<speak>`; không dùng `<lang>` dưới Nam Minh để giả giọng Anh, không đổi pitch/rate, không dịch hoặc thêm từ. XML được escape; các spans ghép lại phải trùng canonical text chính xác. Không thêm whitespace định dạng giữa các voice tags vào request.

Kế hoạch báo riêng số code point lời thoại và số ký tự trong phần SSML tính phí: bỏ `<speak>`/`<voice>`, giữ dấu câu, khoảng trắng và markup tùy chọn như `<phoneme>`. Han được đếm hai theo tài liệu Azure. Với XML entities, dùng cách đếm serialized bảo thủ; không cam kết hóa đơn account bằng con số local. Mẫu bàn giao không có entities nên không có chênh lệch này. Đơn giá snapshot hiện tại là 15 USD/triệu ký tự, meter `S1 Neural Text To Speech Characters` tại Southeast Asia; tên meter công khai S1 không xác minh SKU/hợp đồng của resource S0. Không tạo resource mới. Snapshot quá 7 ngày bị chặn trước paid run; catalogue evidence quá 24 giờ phải kiểm tra lại.

Nếu multi-voice lỗi hoặc không tương thích, **dừng**. Không tự retry và không tự tách request. Chỉ lập kế hoạch `split` mới khi được phép rõ ràng, với số request/chi phí mới; dùng production ID mới cho một phương án recovery được duyệt. Split ghép WAV theo ngôn ngữ, thêm 120 ms silence, không chồng lời. Một ledger có attempt mơ hồ không được reset để chạy tiếp.

## Timing, mix và Remotion

Sau khi đã có WAV Azure thật:

```powershell
python scripts/bilingual/align.py <plan.json> out/bilingual/<production-id> --model <existing-local-faster-whisper-small>
npm run voice:timeline -- <plan.json> .
python scripts/bilingual/audio.py <plan.json> out/bilingual/<production-id> --music <licensed-or-original-48k-stereo.wav> --sfx <original-48k-stereo.wav>
```

Không có nhạc/SFX thì bỏ hai option tương ứng. Có thể dùng score/SFX gốc từ pipeline dự án hiện có; không dùng tài nguyên SeeCut. Normalization từng request và các voice span có timing thật cân bằng mức âm; gain ramp 10 ms làm mượt mức âm, không kéo giãn hoặc thay pitch. Mạo từ quá ngắn không được đo LUFS riêng. Fade 5 ms chỉ áp dụng vào vùng mép đã đo gần im lặng ở split WAV; nếu mép không an toàn, dừng cho kiểm tra, không cắt âm hoặc tái tổng hợp. Mix có ducking nhạc theo giọng, kiểm tra khoảng −16 LUFS và true peak ≤−1.5 dBTP, full decode và giữ nguyên số sample.

`align.py` dùng local model đã có, không tải model hay gọi ASR trả phí. Bản chép ASR chỉ làm bằng chứng timing; phụ đề luôn lấy lát cắt từ canonical text. Thiếu mốc cho một từ, timing lùi, hash sai hoặc chất lượng alignment dưới ngưỡng đều dừng, không nội suy. `observations.json` giữ audio hash, nguồn mốc, khoảng ký tự canonical và văn bản ASR riêng biệt. Từ bị ASR thay thế phải được nghe lại, không coi alignment là bằng chứng phát âm đúng.

`voice:timeline` xuất scene clock, pages/tokens, `voiceSpans`, article events, SRT/VTT theo sample PCM thật. JSON tương thích các trường timeline mà renderer hiện có dùng (`scenes`, `pages`, `tokens`, `markers`, `audioSrc`, `durationInFrames`). `audio.py` xuất `public/bilingual/<id>/manifest.json` và mix.wav. Trong composition mới:

```tsx
const clock = useBilingualVoiceClock(timeline);
// Play the same timeline.audioSrc; show clock.caption?.text.
// Emphasize clock.voiceSpan while Andrew speaks; animate clock.articleEvent.
```

Hook tại `src/BilingualVoiceClock.ts` lấy mốc theo `useCurrentFrame()`; không có thời gian giả. Renderer mới truyền manifest qua `inputProps.timeline` và lấy `durationInFrames` từ manifest. Không gọi renderer Video 01–04 để thử nâng cấp này. Tiếp tục các kiểm tra ffprobe, full decode MP4, mux sync và ảnh bằng chứng của pipeline khi sản xuất video mới.

## Key, ledger và QA

Launcher chỉ đưa key vào môi trường tạm của Node con, không arguments/file/clipboard/browser. Xóa bản sao môi trường ngay sau khi start. SecureString không đảm bảo mọi bản sao managed string trong RAM được xóa tức thời. Không bật transcript/debug ghi secrets. GET-only `-Mode CheckVoices` có thể dùng riêng, không tổng hợp.

Trước paid request: kiểm tra policy/hash, cảnh báo ngôn ngữ, giá, hai giọng, credential, FFmpeg/ffprobe, fsync/hard-link và thư mục Windows. Ghi attempt/chi phí dự phòng xuống ledger trước gửi. Sau response: kiểm tra RIFF, decode stdin (hỗ trợ đường dẫn Windows dài), ffprobe, SHA-256 đọc lại, commit WAV độc quyền, receipt rồi ledger. Bất kỳ timeout/lỗi trạng thái mơ hồ nào đều tiêu thụ attempt và chặn cả chuỗi. Audio đã xác minh được cache theo hash, không tổng hợp lại; hỏng receipt/WAV thì dừng để recovery.

Chạy `npm run test:bilingual`, `python scripts/bilingual/audio_test.py`, `npm run typecheck`, `npm run test:review`. Fixture tone/silence chỉ kiểm tra transport/DSP/timing, không mô phỏng hay đánh giá giọng thật. Kiểm tra phát âm Anh-Mỹ, độ tự nhiên của chuyển giọng, cảm xúc, nhạc và sync tinh chỉ PASS sau khi nghe/xem thật. Hiện tại live compatibility và subjective QA chưa nghiệm thu vì nhiệm vụ này chưa cho phép chi phí TTS mới.
