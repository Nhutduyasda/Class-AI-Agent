# Azure Speech Nam Minh — dự toán Marketing Video 02

Ngày kiểm tra: **15/10/2026**. Chỉ nghiên cứu thông tin công khai và chuẩn bị văn bản cấu hình. **Chưa tạo tài nguyên/tài khoản trả phí, chưa gọi Azure Speech để tổng hợp, chưa tạo audio, chi phí phát sinh trong lượt này: 0 USD.**

## 1. Giọng và quyền thương mại

Danh sách chính thức của Azure Speech có **vi-VN-NamMinhNeural, nam, tiếng Việt**, loại Standard Neural. Đây là đúng voice ID mục tiêu của Video 01. Không dùng Piper, không đổi người đọc tiếng Anh, không clone giọng.

Điều khoản TTS của Microsoft nêu khách hàng **paid tier** có thể dùng output prebuilt neural voices cho mục đích thương mại. Phương án đề xuất là Azure Speech Standard pay-as-you-go với voice dựng sẵn; kiểm tra hợp đồng và tier thực tế trước khi kích hoạt. Không suy diễn quyền này sang Edge consumer, không dựa vào F0/free tier để xác nhận quyền thương mại. Có credit tài khoản cũng không tự chứng minh tài nguyên đang ở đúng tier/quyền.

Nguồn: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support ; https://www.microsoft.com/licensing/terms/en-US/productoffering/MicrosoftAzure/allprograms ; điều khoản được kiểm tra thêm tại https://www.microsoft.com/licensing/terms/en-US/productoffering/MicrosoftAzureServices/EAEAS/SpecificUseRights .

## 2. Đơn giá đã xác minh

Azure Retail Prices API công khai trả về:
- Product: Azure Speech; SKU/meter: **S1 / S1 Neural Text To Speech Characters**.
- Region dự kiến: **southeastasia (AP Southeast)**.
- Unit: **1M**; retailPrice/unitPrice: **15 USD**.
- meterId: `0f98e708-a16c-407b-8089-a0ed9e14ab49`.
- effectiveStartDate trong bản giá: 2024-02-01; bản trả về được lấy ngày 15/10/2026.

Đây là giá niêm yết PAYG theo ký tự cho Neural thông thường. Không chọn Neural HD, Long Audio, Custom Voice, Avatar, model hosting hoặc Commitment Tier. Tên meter trong bảng giá không đồng nghĩa tên SKU phải chọn trên màn hình tạo resource; phải kiểm tra Standard paid PAYG thực tế khi được phép triển khai.

Trang giá public render dấu `$-` trong công cụ đọc web, nên con số 15 USD được lấy từ Retail Prices API chính thức, không đoán từ trang đó. Bản ghi giá, meter và truy vấn lưu trong cost-model.json/sources.json.

Nguồn: https://prices.azure.com/api/retail/prices ; https://azure.microsoft.com/en-us/pricing/details/speech/ .

## 3. Đếm ký tự và cách tính

Nguồn duy nhất: `briefs/marketing-video-02-approved.json`. Chuỗi tiếng Việt đã ở dạng Unicode NFC. Đếm từng Unicode code point, **gồm chữ, số, khoảng trắng, dấu câu**. Kết quả không phải số byte hoặc số từ.

| Đoạn | Ký tự |
|---|---:|
| HOOK | 82 |
| PROBLEM | 120 |
| SOLUTION | 120 |
| DEMO | 188 |
| BENEFIT | 126 |
| CTA | 99 |
| **Toàn bộ** | **735** |

Mẫu A = HOOK nguyên đoạn; mẫu B = DEMO nguyên đoạn. Hai mẫu cộng **270 ký tự**.

Payload dự toán dùng duy nhất `<speak>` và `<voice>` với nguyên văn nội dung, không thêm newline/space bên ngoài nội dung, không `<prosody>`/`<break>`/phoneme/alias. Theo Microsoft, speak/voice tags không tính tiền; các markup tùy chọn khác có thể tính. Mặc định tốc độ/pitch trung tính tương ứng +0%; do đó không cần markup prosody để đặt lại mặc định. Sáu payload văn bản có sẵn trong proposed-requests.json, chưa gửi đi.

**USD = ký tự × 15 / 1.000.000.**

Quy đổi tham khảo **1 USD = 26.090 VND**, giá bán USD Vietcombank từ XML cập nhật **15/10/2026 09:18:40**. Đây là tỷ giá tham khảo, không phải cam kết tỷ giá Azure hoặc thẻ của bạn.

| Phạm vi, mỗi đoạn tạo một lần | Ký tự tính phí | USD trước thuế | VND tham khảo, làm tròn |
|---|---:|---:|---:|
| Mẫu HOOK | 82 | 0,001230 | 32 đ |
| Mẫu DEMO | 188 | 0,002820 | 74 đ |
| **Hai mẫu A+B** | **270** | **0,004050** | **106 đ** |
| **Voiceover đầy đủ, sáu cảnh** | **735** | **0,011025** | **288 đ** |
| Hai mẫu rồi tạo lại toàn bộ sáu cảnh | 1.005 | 0,015075 | 393 đ |
| Sau hai mẫu, chỉ tạo bốn cảnh còn lại | 465 thêm | 0,006975 thêm | 182 đ thêm |
| Tổng khi tái sử dụng đúng hai mẫu được duyệt | 735 tổng | 0,011025 tổng | 288 đ tổng |

Chi phí voiceover đầy đủ ở bảng chỉ là tổng hợp giọng, không phải phí dịch vụ dựng video. Nghe file/cân chỉnh mix/render lại từ cache không gọi TTS thì không thêm phí tổng hợp. Cache hai mẫu chỉ tái sử dụng khi payload/giọng/settings giữ nguyên và người dùng duyệt đúng các take đó; nếu đổi nhịp phải tính request mới.

Các số USD là phép tính chính xác **theo payload và đơn giá giả định đã nêu**. Chưa có tài khoản/tier/hợp đồng được chọn nên không thể xác nhận số tiền cuối trên hóa đơn: thuế, tỷ giá thanh toán, làm tròn tổng hóa đơn và phí ngân hàng tùy tài khoản. Không khẳng định ngân hàng sẽ trừ riêng đúng 106 đ.

Nguồn billing: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech#pricing-note ; tỷ giá: https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx .

## 4. Cấu hình để gần Video 01 nhất

- Voice ID cố định **vi-VN-NamMinhNeural**; locale vi-VN; Standard Neural PAYG; chỉ một người dẫn cho cả Việt/Anh ở hai mẫu đầu.
- Tốc độ mặc định **+0%**, pitch mặc định **không nâng/hạ tông**, volume mặc định trước normalize; không time-stretch, đổi formant, clone giọng, emotion/style không được voice hỗ trợ.
- Mỗi đoạn HOOK/DEMO tổng hợp nguyên câu/đoạn đúng như Video 01 dùng spokenSegments; giữ dấu câu và ellipsis. Không chẻ thành 27 cụm Piper hoặc phiên âm chát gi pi ti/ây ai trước khi nghe mẫu nguyên bản. Cùng Nam Minh thử đọc improve và câu tiếng Anh trước.
- Đầu ra dự kiến WAV PCM mono 48 kHz/16-bit, giữ bản raw. Cân âm cục bộ về khoảng -16 LUFS, mix stereo bằng equal-power pan; true peak mục tiêu <= -1,5 dBTP. Không EQ/đổi pitch để giả âm sắc khác.
- Chỉ sau duyệt giọng: tái tạo audio clock, thêm đuôi nghỉ khoảng 0,35s rồi làm tròn lên grid nhạc 90 BPM như builder Video 01; giữ nhịp nghỉ nội câu từ engine. Không ép thời lượng cũ; cập nhật tối thiểu subtitle/animation theo PCM thật, không thay visual/copy.
- Nhạc gốc ban đầu khoảng -36 LUFS, duck theo voice với attack 20ms/release 280ms như Video 01, fades 350/700ms. Duyệt voice mẫu **không nhạc** trước, rồi kiểm tra cả mix/mono/điện thoại sau khi được phép làm full.

Cùng voice ID là điều kiện cần, **không bảo đảm Azure và Edge nghe giống tuyệt đối** do phiên bản model/backend. Video 01 thật vẫn là chuẩn nghe. Không tự tuyên bố cảm xúc/phát âm MATCH từ metadata; người dùng nghe hai mẫu rồi chọn/đưa phản hồi. Nhất là improve, câu I want to improve my English., AI và BẮT ĐẦU.

## 5. Rủi ro phát sinh và giới hạn đề xuất

1. Mỗi lần tạo lại/take mới là usage mới. Request timeout có thể đã xử lý và tính tiền; không tự retry mù. Cache theo text/voice/settings, ghi ledger ký tự trước request. Đổi region/voice class/SSML phải tính lại dự toán.
2. SSML tùy chọn có thể tính thêm ký tự. Ví dụ `<break time="250ms"/>` dài 21 ký tự → thêm 0,000315 USD (~8 đ) nếu được đếm nguyên markup; dự toán mẫu đầu không dùng nó. Khoảng nghỉ giữa các scene được thêm cục bộ thì không thêm ký tự TTS.
3. Thuế/ngoại tệ/phí thẻ chưa xác định. Nếu chỉ để lập ngân sách và cộng **20% dự phòng minh họa** (không phải thuế suất thực tế), hai mẫu ~127 đ; mẫu + full tạo lại ~472 đ. Không xem tỷ lệ này là trần hóa đơn ngân hàng.
4. Không cần VM, storage account, custom model hosting hay commitment package cho khối lượng này. Chỉ tài nguyên Speech PAYG khi được duyệt; file lưu/render cục bộ. Những tài nguyên khác đang có trên subscription, nếu có, không nằm trong báo giá này. Budget alert Azure **không tự chặn tiêu thụ**; chặn bằng số request/ký tự ở quy trình chạy.
5. Ví dụ dự phòng nhiều take: lặp toàn bộ quy trình mẫu+full 4 lần = 4.020 ký tự → 0,0603 USD (~1.573 đ), chưa thuế/phí. Đây là kịch bản phân tích, **không phải cho phép tự chạy bốn lượt**.

Nguồn budget: https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets .

## 6. Phạm vi để chủ dự án quyết định

Đề xuất vòng phê duyệt tiếp theo chỉ gồm **2 request HOOK+DEMO, 270 ký tự, dự toán 0,00405 USD trước thuế**, không tự thử lại, không fallback giọng. Đề xuất dự phòng tiền usage riêng cho vòng mẫu là 0,01 USD (~261 đ), **chưa được duyệt và không phải hard cap hóa đơn Azure**. Nếu cần markup hoặc request mới vượt scope 270 ký tự thì báo lại trước.

Ngay cả khi hai mẫu được duyệt chi phí, vẫn chưa được tạo voiceover đầy đủ hoặc render V1.2 cho đến khi người dùng nghe và duyệt giọng. Hiện tại toàn bộ các bước tạo tài nguyên, tổng hợp audio và chi phí vẫn **CHƯA ĐƯỢC PHÉP THỰC THI**. Kịch bản/hình Video 02 giữ nguyên.
