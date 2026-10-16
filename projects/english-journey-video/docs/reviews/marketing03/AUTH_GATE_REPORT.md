# Video 03 — Secure Azure Authentication Gate

Ngày kiểm tra: 2026-10-16. Checkpoint nguồn: `430eb316d2231a177c86078e05ce6aac8c7a9443`.

**REST authentication readiness: BLOCKED.** Code xác thực và nhận WAV đã kiểm thử offline; chưa có credential được cấp an toàn vào runtime và chưa xác minh xác thực Speech thực tế. Không gọi TTS, không tạo HOOK, không retry, không render hoặc phát sinh chi phí trong nhiệm vụ này.

## Kiểm tra Azure chỉ đọc

Phiên Microsoft hiện có tự đăng nhập thành công trong Azure Portal; không cần nhập lại mật khẩu. Chỉ xem Overview/JSON View, Networking và IAM → View my access. Không đọc key, trích token phiên trình duyệt hoặc thay đổi tài nguyên.

| Thuộc tính | Quan sát thực tế |
|---|---|
| Resource | english-journey-namminh |
| Kind / trạng thái | SpeechServices / Active |
| Region / tier | Southeast Asia / Standard S0 |
| Endpoint | https://southeastasia.api.cognitive.microsoft.com/ |
| Custom subdomain | Chưa cấu hình: Networking hiển thị “Custom Domain Name is required for VNet” và “Generate Custom Domain Name” |
| Networking | Public network enabled; All networks |
| Role tài khoản hiện tại | Owner (kế thừa subscription, hai dòng) và Foundry User (kế thừa subscription) |
| Speech data-plane role | Không thấy Cognitive Services Speech User/Contributor trong Current role assignments của tài khoản này; chưa đánh giá một service principal khác |
| disableLocalAuth | Không được trả về trong JSON View API 2021-04-30; không suy luận là false |

## Đánh giá Microsoft Entra

Speech hỗ trợ Entra nhưng cấu hình hiện tại chưa đủ điều kiện: cần custom subdomain và một principal có **Cognitive Services Speech User** hoặc **Cognitive Services Speech Contributor** phù hợp. Owner không phải bằng chứng quyền Speech data-plane.

Scope lấy access token: `https://cognitiveservices.azure.com/.default`.

Header Speech REST theo tài liệu Microsoft:

```text
Authorization: Bearer aad#<ARM resource ID>#<Entra access token>
```

Không gửi raw Entra JWT như STS bearer. STS từ key exchange là loại token khác, có thời hạn ngắn và ràng buộc host phát hành. Pipeline chỉ chấp nhận STS từ origin vùng Southeast Asia cho endpoint vùng cố định.

Tài liệu REST TTS có đoạn Entra dùng cách gọi “Speech to text REST API for short audio” trong cùng trang; báo cáo này dựa trên định dạng header công bố, không tuyên bố đã xác minh bằng yêu cầu TTS thật.

Tạo custom domain là thay đổi không thể đảo ngược theo tài liệu Microsoft. Chưa thực hiện, chưa phân quyền hoặc tạo resource/application. Nếu chọn Entra, chủ tài nguyên cần quyết định riêng việc cấu hình domain, chỉ định principal và cấp role tối thiểu; sau đó đăng nhập qua Azure Identity trên máy/môi trường bí mật phù hợp. Phiên Portal hiện tại không tự cấp token an toàn cho tiến trình Node.

## Phương án API key và credential an toàn

API key là phương án ít thay đổi tài nguyên hơn, **nếu local/key authentication đang được cho phép**. Trạng thái disableLocalAuth và tính hợp lệ của key chưa được xác minh. Không lấy hoặc hiển thị key để kiểm tra.

Runtime Work hiện không có SPEECH_KEY, SPEECH_STS_TOKEN hoặc SPEECH_ENTRA_ACCESS_TOKEN. Không có kênh nhập arbitrary secret vào tiến trình thực thi được cung cấp trong phiên này. Browser sign-in không phải cơ chế chuyển Speech API key vào runtime. Do đó không yêu cầu gửi secret qua chat, không lấy từ clipboard trình duyệt và không dùng repository .env.

Đã chuẩn bị lựa chọn chạy **trên máy riêng**:

1. Checkout nhánh Video 03, cài Node.js và Python; chạy trong terminal riêng không ghi hình/log, không chạy qua agent PTY.
2. Trong `projects/english-journey-video/`, chạy `python scripts/marketing03/local-secret-preflight.py` (hoặc `python3` tùy hệ điều hành).
3. Nhập existing Speech key vào prompt ẩn trên máy của bạn. Key chỉ truyền trong environment của tiến trình con, không qua command-line, shell history, file hoặc Git. Environment không được mã hóa trong bộ nhớ và có thể bị tiến trình cùng quyền/admin đọc; chỉ dùng máy đáng tin cậy.
4. Helper chỉ kiểm tra định dạng offline, không liên hệ Azure, không lưu key và **vẫn báo BLOCKED vì provider chưa xác minh**. Đây chưa phải chứng minh key hợp lệ và chưa cho phép tổng hợp.
5. Để tiếp tục sản xuất sau này, cần chạy cùng pipeline trong local runner hoặc môi trường có secret manager với cấp secret lúc chạy; không chuyển key trở lại chat. Việc thiết lập runner/secret manager và kiểm tra xác thực thật cần được xác nhận trước, không tự thực hiện trong nhiệm vụ này.

Helper từ chối môi trường không tương tác trước khi đọc input. Chưa dùng helper với key thật. Chưa gọi token exchange, voices/list hoặc bất kỳ endpoint Speech data-plane nào.

## Thay đổi và kiểm thử thực tế

- Tách `auth.mjs`: phân biệt key / STS / Entra; chặn credential mơ hồ, legacy bearer không rõ loại, header có whitespace/control characters; kiểm tra origin/hạn STS, resource ID/domain/audience/hạn Entra; tạo đúng `aad#resource#token` trong bộ nhớ.
- JWT chỉ được giải mã để kiểm tra hình thức; không xác minh chữ ký, RBAC hoặc nhà cung cấp offline.
- Status chỉ xuất boolean/mã lỗi cố định, không xuất credential hoặc claims. ProviderValidated luôn false trong preflight.
- `auth-preflight.mjs` không có network call và không nhập module có side effect TTS.
- Giữ nguyên cơ chế reservation, ghi lượt trước transport, chặn retry và WAV exclusive-write → FFmpeg decode → ffprobe → readback SHA → receipt → trạng thái nhận audio.

| Kiểm tra đã chạy | Kết quả |
|---|---|
| Auth tests mới + pipeline tests hiện có | 28/28 PASS; mock/synthetic credentials chỉ dùng cho test |
| TypeScript `tsc --noEmit` | PASS |
| Local HTTP binary WAV roundtrip | PASS, 1 request localhost, 0 Azure requests |
| WAV mẫu | 48,000 Hz, mono, PCM 16-bit; 2 giây; 192,044 bytes |
| Full FFmpeg decode, ffprobe, đọc lại file | PASS |
| SHA-256 WAV mẫu | 1256c9ef3fd17c1f401fbe31e4d25ca5849f56df85b325498574791cf3839b47 |
| Secret preflight hiện tại | CREDENTIAL_MISSING; BLOCKED |
| Local helper non-interactive refusal | PASS; không đọc input |
| Ledger và brief byte-identical với checkpoint | PASS |
| Git diff whitespace check | PASS |
| Live Azure authentication / TTS | NOT TESTED / NOT CALLED |
| MP4 render | NOT RUN |

WAV kiểm thử chỉ là tone cục bộ, không phải Nam Minh hoặc HOOK khôi phục. Remotion/Chrome không bị sửa hoặc render lại trong nhiệm vụ này; kết quả enumeration thành công của checkpoint trước được giữ nguyên, không tính là lần kiểm tra mới.

## Ledger và ngân sách

| Cảnh | Lượt lịch sử | Lượt mới |
|---|---:|---:|
| HOOK | 1 | 0 |
| PROBLEM | 0 | 0 |
| SOLUTION | 0 | 0 |
| DEMO | 0 | 0 |
| BENEFIT | 0 | 0 |
| CTA | 0 | 0 |

Ledger nguồn được giữ nguyên toàn bộ byte, gồm lịch sử HOOK thất lạc và HOOK_RECOVERY_FAILED. Chi phí tham chiếu lịch sử: 61 ký tự × 15 USD/triệu = 0,000915 USD có thể đã tính phí. Chi phí nhiệm vụ này: **0 USD**. Ngân sách 0,05 USD không bị thay đổi; chưa đối chiếu hóa đơn Azure.

## Điều kiện còn thiếu

1. Một runner có credential được cấp an toàn, không qua chat/repository, và quyền truy cập mạng phù hợp.
2. API key: xác minh local auth được phép và credential hợp lệ bằng quy trình không tổng hợp được thống nhất riêng; hoặc Entra: custom domain + Speech RBAC + scope/token đúng.
3. Chỉ khi gate an toàn được thiết lập và xác minh, mới đề nghị duyệt thêm đúng một lượt HOOK. Hiện **chưa đề nghị và chưa thực hiện** lượt HOOK thứ hai.
4. Sau phê duyệt đó mới cập nhật authorization có giới hạn, giữ ledger cũ, cho phép duy nhất HOOK lần 2 và tối đa một lượt cho mỗi cảnh còn lại trong ngân sách.

## Nguồn chính thức

- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-configure-azure-ad-auth
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech
- Cấu hình resource và IAM: quan sát trực tiếp Azure Portal ngày 2026-10-16, chỉ đọc. Không lưu ảnh chứa danh tính, token hoặc key.
