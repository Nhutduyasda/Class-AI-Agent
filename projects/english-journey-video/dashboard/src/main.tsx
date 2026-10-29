import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { localApi } from "./api";
import {
  type Job,
  type Overview,
  type DraftInput,
  type DashboardAdapter,
} from "./contracts";
import "./style.css";
const tabs = [
  "Overview",
  "English Learning",
  "Product Showcase",
  "Video Jobs",
  "Preview & Review",
  "Presenter Minh",
  "Voice Profiles",
  "Budget & Scheduling",
] as const;
type Tab = (typeof tabs)[number];
const visibility = [
  "NO_PRESENTER",
  "VOICE_ONLY",
  "HANDS_ONLY",
  "FACE_ONLY",
  "HALF_BODY",
  "FULL_BODY",
];
const voices = [
  "learning-clear",
  "review-energetic",
  "narrative-natural",
  "neutral-fallback",
];
function App({ api = localApi }: { api?: DashboardAdapter }) {
  const [page, setPage] = useState<Tab>("Overview"),
    [data, setData] = useState<Overview | null>(null),
    [selected, setSelected] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const refresh = async () => {
    try {
      setData(await api.overview());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  const jobs = data?.jobs || [],
    job = jobs.find((j) => j.id === selected) || jobs[0];
  const action = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="mark">
            EJ<span>✦</span>
          </div>
          <div>
            <strong>AUTO FACTORY</strong>
            <small>English Journey Studio</small>
          </div>
        </div>
        <div className="side-section">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {tabs.map((t, i) => (
            <button
              key={t}
              className={page === t ? "active" : ""}
              onClick={() => {
                setPage(t);
                setMessage("");
                setError("");
              }}
            >
              <span className="nav-icon">
                {["◫", "✎", "◈", "▤", "▷", "♙", "♫", "⚙"][i]}
              </span>
              <span>{t}</span>
              {t === "Video Jobs" && <em>{jobs.length}</em>}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="online-dot" /> LOCAL DEMO MODE{" "}
          <p>Không có lệnh sản xuất trả phí. Không có đăng tải.</p>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <span className="eyebrow">CREATOR WORKSPACE / GATE 3A</span>
            <h1>{page}</h1>
          </div>
          <div className="identity">
            <span className="mode-badge">● MOCK_OFFLINE</span>
            <span className="avatar">ND</span>
            <span className="owner">
              Demo owner<small>Danh tính giả lập</small>
            </span>
          </div>
        </header>
        <div className="content">
          {error && (
            <div className="alert error" role="alert">
              {error}{" "}
              <button onClick={() => void refresh()}>Thử tải lại</button>
            </div>
          )}
          {message && (
            <div className="alert success" role="status">
              {message}
            </div>
          )}
          {!data ? (
            <div className="panel">Đang tải dữ liệu demo…</div>
          ) : (
            <>
              {page === "Overview" && (
                <>
                  <div className="hero">
                    <div>
                      <span className="hero-tag">
                        YOUR CREATIVE CONTROL ROOM
                      </span>
                      <h2>
                        Ý tưởng hôm nay.
                        <br />
                        <i>Video ngày mai.</i>
                      </h2>
                      <p>
                        Thiết kế, kiểm tra và duyệt video ở một nơi. Mọi thao
                        tác trong bản này chỉ chạy offline.
                      </p>
                      <button
                        className="primary"
                        onClick={() => setPage("English Learning")}
                      >
                        Tạo video bài học <span>↗</span>
                      </button>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <div className="art-ring">
                        <div className="art-card">
                          EJ<span>▶</span>
                          <small>9:16 STUDIO</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="stats">
                    <Stat
                      label="Tổng jobs"
                      value={String(jobs.length)}
                      detail="Fixtures + bản nháp"
                    />
                    <Stat
                      label="Chờ xem xét"
                      value={String(
                        jobs.filter((j) => j.status === "PENDING_OWNER_REVIEW")
                          .length,
                      )}
                      detail="Cần đánh giá của chủ"
                    />
                    <Stat
                      label="Ước tính"
                      value={money(data.budget.estimatedMicrousd)}
                      detail="Chưa chi thực tế"
                    />
                    <Stat
                      label="Đã xác nhận"
                      value="$0.00"
                      detail="Chỉ mock; số dư thật chưa rõ"
                    />
                  </div>
                  <div className="split">
                    <section className="panel">
                      <div className="section-title">
                        <div>
                          <span className="eyebrow">PRODUCTION ACTIVITY</span>
                          <h3>Gần đây</h3>
                        </div>
                        <button
                          className="link"
                          onClick={() => setPage("Video Jobs")}
                        >
                          Xem tất cả →
                        </button>
                      </div>
                      <JobList
                        jobs={jobs.slice(0, 4)}
                        open={(j) => {
                          setSelected(j.id);
                          setPage("Preview & Review");
                        }}
                      />
                    </section>
                    <section className="panel mint">
                      <span className="eyebrow">PRODUCTION SAFETY</span>
                      <h3>Chế độ an toàn đang bật</h3>
                      <p>
                        Lịch mỗi ngày đang tắt. Không thể gọi Azure, LLM trả phí
                        hay đăng video từ dashboard demo.
                      </p>
                      <div className="budget-line">
                        <span>Ngân sách sản xuất</span>
                        <b>$8.00</b>
                      </div>
                      <div className="bar">
                        <span />
                      </div>
                      <div className="budget-line">
                        <span>Dự phòng được bảo vệ</span>
                        <b>$2.00</b>
                      </div>
                      <div className="budget-line">
                        <span>Số dư tài khoản thật</span>
                        <b>UNVERIFIED</b>
                      </div>
                    </section>
                  </div>
                </>
              )}
              {page === "English Learning" && (
                <LearningForm
                  busy={busy}
                  submit={(x) =>
                    action(async () => {
                      const j = await api.create(x);
                      setMessage(
                        `Đã lưu bản nháp ${j.id}. Chưa render, chưa phát sinh chi phí.`,
                      );
                      setSelected(j.id);
                      setPage("Preview & Review");
                    })
                  }
                />
              )}
              {page === "Product Showcase" && (
                <ProductForm
                  busy={busy}
                  submit={(x) =>
                    action(async () => {
                      await api.validateProduct(
                        x as Extract<DraftInput, { mode: "PRODUCT_SHOWCASE" }>,
                      );
                      const j = await api.create(x);
                      setMessage(
                        `Đã lưu bản nháp ${j.id}. Dữ kiện chỉ dựa trên bằng chứng bạn nhập.`,
                      );
                      setSelected(j.id);
                      setPage("Preview & Review");
                    })
                  }
                />
              )}
              {page === "Video Jobs" && (
                <section className="panel">
                  <div className="section-title">
                    <div>
                      <span className="eyebrow">YOUR LIBRARY</span>
                      <h3>Production queue</h3>
                    </div>
                    <span className="pill">{jobs.length} items</span>
                  </div>
                  <JobList
                    jobs={jobs}
                    open={(j) => {
                      setSelected(j.id);
                      setPage("Preview & Review");
                    }}
                  />
                </section>
              )}
              {page === "Preview & Review" && (
                <>
                  <label className="field select-job">
                    Chọn video
                    <select
                      value={job?.id || ""}
                      onChange={(e) => setSelected(e.target.value)}
                    >
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title} · {j.id}
                        </option>
                      ))}
                    </select>
                  </label>
                  {job ? (
                    <Review
                      job={job}
                      busy={busy}
                      review={(decision, notes) =>
                        action(async () => {
                          await api.review(job.id, {
                            revision: job.revision,
                            artifactSha256: job.artifactSha256 || "",
                            decision,
                            notes,
                          });
                          setMessage(
                            "Đã lưu quyết định demo theo đúng SHA-256. Không cho phép xuất bản.",
                          );
                        })
                      }
                    />
                  ) : (
                    <div className="panel empty">
                      Chưa có video. Hãy tạo bản nháp hoặc thêm fixture
                      Remotion.
                    </div>
                  )}
                </>
              )}
              {page === "Presenter Minh" && (
                <div className="split">
                  <section className="panel">
                    <span className="eyebrow">IDENTITY PACK / MINH-MAIN</span>
                    <h2>
                      Minh <span className="pill amber">TEXT ONLY</span>
                    </h2>
                    <p>
                      Host chung cho hai kênh. Nam Á Đông trẻ, tóc đen/nâu hơi
                      gợn, mắt nâu, nụ cười thân thiện, phong cách smart casual.
                    </p>
                    <div className="notice">
                      Chưa có ảnh/clip Minh đã được xác minh. Không dùng hình
                      placeholder để nhận diện nhân vật thật.
                    </div>
                    <h3>Chế độ xuất hiện</h3>
                    <div className="chips">
                      {visibility.map((x) => (
                        <span key={x}>{x.replaceAll("_", " ")}</span>
                      ))}
                    </div>
                  </section>
                  <section className="panel">
                    <span className="eyebrow">ASSET READINESS</span>
                    <h3>Chưa sẵn sàng cho production</h3>
                    <p>
                      Fixture chỉ có hình học minh họa; không phải khuôn mặt,
                      bàn tay hoặc cơ thể của Minh.
                    </p>
                    <p>
                      Việc dùng media tương lai cần SHA-256, quyền sử dụng,
                      nguồn, phạm vi và trạng thái xét duyệt.
                    </p>
                    <div className="notice">
                      Trạng thái: PRESENTER_ASSET_UNVERIFIED
                    </div>
                  </section>
                </div>
              )}
              {page === "Voice Profiles" && (
                <div className="voice-grid">
                  {voices.map((v, i) => (
                    <article className="panel voice-card" key={v}>
                      <span className="number">0{i + 1}</span>
                      <h3>{v}</h3>
                      <p>
                        {
                          [
                            "Giải thích rõ, ngắt nhịp cho người mới.",
                            "Nhịp tích cực khi giới thiệu sản phẩm.",
                            "Kể chuyện tự nhiên, nhẹ nhàng.",
                            "Nhịp trung tính dự phòng.",
                          ][i]
                        }
                      </p>
                      <span className="pill">Direction metadata · no TTS</span>
                    </article>
                  ))}
                </div>
              )}
              {page === "Budget & Scheduling" && (
                <div className="split">
                  <section className="panel">
                    <span className="eyebrow">FINANCIAL POLICY</span>
                    <h3>Ngân sách dự án</h3>
                    <div className="big-number">
                      $10<span>.00</span>
                    </div>
                    <p>
                      Do chủ dự án khai báo; chưa đối chiếu hóa đơn hoặc số dư
                      nhà cung cấp.
                    </p>
                    {[
                      ["Cho sản xuất", "$8.00"],
                      ["Dự phòng", "$2.00"],
                      ["Trần ước tính / video", "$0.08"],
                      [
                        "Ước tính các draft",
                        money(data.budget.estimatedMicrousd),
                      ],
                      ["Chi phí xác nhận", "$0.00"],
                      ["Số dư provider", "UNVERIFIED"],
                    ].map(([a, b]) => (
                      <div className="budget-line" key={a}>
                        <span>{a}</span>
                        <b>{b}</b>
                      </div>
                    ))}
                  </section>
                  <section className="panel">
                    <span className="eyebrow">OPERATIONS</span>
                    <h3>Không bật lịch chạy</h3>
                    <p>
                      Lịch hằng ngày, paid execution và publication đều bị khóa
                      tại máy chủ. Trình duyệt không có quyền thay đổi CostGuard
                      hoặc phát lệnh GitHub Actions.
                    </p>
                    <button disabled className="disabled-action">
                      Lên lịch tự động · Gate 4
                    </button>
                    <div className="notice">
                      Bản demo không thay thế giới hạn chi tiêu của nhà cung
                      cấp.
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
function localDateTime() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
function money(n: number) {
  return "$" + (n / 1e6).toFixed(2);
}
function JobList({ jobs, open }: { jobs: Job[]; open: (j: Job) => void }) {
  return jobs.length ? (
    <div className="job-list">
      {jobs.map((j) => (
        <button className="job-row" key={j.id} onClick={() => open(j)}>
          <span className="job-thumb">
            {j.mode === "ENGLISH_LEARNING" ? "Aa" : "◈"}
          </span>
          <span className="job-copy">
            <strong>{j.title}</strong>
            <small>
              {j.mode.replaceAll("_", " ")} ·{" "}
              {j.fixture ? "Offline fixture" : "Draft only"}
            </small>
          </span>
          <span
            className={"status " + (j.status === "VALIDATED" ? "draft" : "")}
          >
            {j.status.replaceAll("_", " ")}
          </span>
          <span className="arrow">↗</span>
        </button>
      ))}
    </div>
  ) : (
    <div className="empty">Chưa có job nào. Bắt đầu với một bản nháp.</div>
  );
}
function LearningForm({
  busy,
  submit,
}: {
  busy: boolean;
  submit: (x: DraftInput) => void;
}) {
  const [topic, setTopic] = useState("Dùng a hay an trước apple"),
    [duration, setDuration] = useState(24),
    [voice, setVoice] = useState("learning-clear"),
    [vis, setVis] = useState("VOICE_ONLY");
  return (
    <div className="split form-layout">
      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          submit({
            mode: "ENGLISH_LEARNING",
            topic,
            level: "A1",
            duration,
            template: "MICRO_LESSON",
            voiceProfile: voice as any,
            visibility: vis as any,
          });
        }}
      >
        <span className="eyebrow">01 / CREATE DRAFT</span>
        <h3>English Learning</h3>
        <p>
          Một điểm học trong 20–35 giây. Ví dụ tiếng Anh dùng Andrew; lời Việt
          dùng Nam Minh khi Gate 3B được cho phép.
        </p>
        <label className="field">
          Chủ đề demo
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option>Dùng a hay an trước apple</option>
            <option>Dùng a trước âm phụ âm</option>
          </select>
        </label>
        <div className="fields">
          <label className="field">
            Trình độ
            <select>
              <option>A1</option>
            </select>
          </label>
          <label className="field">
            Thời lượng (giây)
            <input
              type="number"
              min="20"
              max="35"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </label>
        </div>
        <label className="field">
          Mẫu video
          <select>
            <option value="MICRO_LESSON">
              Micro lesson · hook → ví dụ → giải thích → CTA
            </option>
          </select>
        </label>
        <label className="field">
          Voice profile
          <select value={voice} onChange={(e) => setVoice(e.target.value)}>
            {voices.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Presenter visibility
          <select value={vis} onChange={(e) => setVis(e.target.value)}>
            {["FACE_ONLY", "HALF_BODY", "VOICE_ONLY", "NO_PRESENTER"].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
        </label>
        <button className="primary" disabled={busy}>
          Lưu bản nháp offline →
        </button>
      </form>
      <section className="panel preview-panel">
        <span className="eyebrow">02 / SCRIPT PREVIEW</span>
        <h3>Xem trước cấu trúc</h3>
        <div className="script-line">
          <b>01 · HOOK</b>
          <p>Hôm nay: {topic || "[thiếu chủ đề]"}</p>
        </div>
        <div className="script-line">
          <b>02 · EXAMPLE / ANDREW</b>
          <p>
            {topic === "Dùng a trước âm phụ âm"
              ? "She is a teacher."
              : "I ate an apple."}
          </p>
        </div>
        <div className="script-line">
          <b>03 · EXPLAIN / NAM MINH</b>
          <p>
            {topic === "Dùng a trước âm phụ âm"
              ? "Dùng a trước âm phụ âm."
              : "Dùng an trước âm nguyên âm."}
          </p>
        </div>
        <div className="script-line">
          <b>04 · PRACTICE</b>
          <p>Thử đặt một câu với an nhé.</p>
        </div>
        <div className="notice">
          Bản nháp chưa render, chưa có audio. Chỉ có hai chủ đề đã chuẩn bị
          offline; không có AI sinh script tùy ý.
        </div>
        <div className="budget-line">
          <span>Ước tính trần (chưa chi)</span>
          <b>≤ $0.08</b>
        </div>
      </section>
    </div>
  );
}
function ProductForm({
  busy,
  submit,
}: {
  busy: boolean;
  submit: (x: DraftInput) => void;
}) {
  const [platform, setPlatform] = useState("SHOPEE"),
    [url, setUrl] = useState(""),
    [name, setName] = useState(""),
    [category, setCategory] = useState("PHONE_CASE"),
    [attribute, setAttribute] = useState(""),
    [claim, setClaim] = useState(""),
    [source, setSource] = useState(""),
    [capturedAt, setCaptured] = useState(localDateTime()),
    [cta, setCta] = useState("Xem thông tin trong trang sản phẩm."),
    [disclosure, setDisclosure] = useState(""),
    [visibility, setVisibility] = useState("HANDS_ONLY"),
    [voice, setVoice] = useState("review-energetic");
  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    submit({
      mode: "PRODUCT_SHOWCASE",
      platform: platform as any,
      inputUrl: url,
      name,
      category: category as any,
      attribute,
      evidenceSource: source,
      capturedAt: new Date(capturedAt).toISOString(),
      claim,
      asset: "SYNTHETIC_FIXTURE",
      cta,
      disclosure,
      voiceProfile: voice as any,
      visibility: visibility as any,
    });
  };
  return (
    <div className="split form-layout">
      <form className="panel" onSubmit={submitForm}>
        <span className="eyebrow">MANUAL EVIDENCE ONLY</span>
        <h3>Product Showcase</h3>
        <div className="notice">
          URL chỉ được kiểm tra định dạng. Không tải dữ liệu Shopee/TikTok Shop.
          Không coi nguồn tự khai là sự thật đã kiểm chứng.
        </div>
        <div className="fields">
          <label className="field">
            Nền tảng
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option>SHOPEE</option>
              <option>TIKTOK_SHOP</option>
            </select>
          </label>
          <label className="field">
            Danh mục
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setVisibility(
                  e.target.value === "FASHION" ? "HALF_BODY" : "HANDS_ONLY",
                );
              }}
            >
              {["PHONE_CASE", "DESK", "ART", "FASHION"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          URL HTTPS
          <input
            required
            type="url"
            placeholder="https://shopee.vn/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
        <label className="field">
          Tên sản phẩm
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          Thuộc tính có bằng chứng
          <input
            required
            placeholder="Ví dụ: màu xanh"
            value={attribute}
            onChange={(e) => setAttribute(e.target.value)}
          />
        </label>
        <label className="field">
          Claim trong video (phải trùng thuộc tính)
          <input
            required
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
          />
        </label>
        <label className="field">
          Nguồn bằng chứng do chủ cung cấp
          <input
            required
            placeholder="Ảnh chụp mô tả / ghi chú nguồn"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </label>
        <label className="field">
          Thời điểm bằng chứng
          <input
            required
            type="datetime-local"
            value={capturedAt}
            onChange={(e) => setCaptured(e.target.value)}
          />
        </label>
        <div className="fields">
          <label className="field">
            Presenter
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              {(category === "FASHION"
                ? [
                    "FACE_ONLY",
                    "HALF_BODY",
                    "FULL_BODY",
                    "VOICE_ONLY",
                    "NO_PRESENTER",
                  ]
                : ["HANDS_ONLY", "VOICE_ONLY", "NO_PRESENTER"]
              ).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Voice
            <select value={voice} onChange={(e) => setVoice(e.target.value)}>
              {voices.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          CTA
          <input
            required
            value={cta}
            onChange={(e) => setCta(e.target.value)}
          />
        </label>
        <label className="field">
          Disclosure (nếu có)
          <input
            value={disclosure}
            onChange={(e) => setDisclosure(e.target.value)}
          />
        </label>
        <button className="primary" disabled={busy}>
          Kiểm tra & lưu draft →
        </button>
      </form>
      <section className="panel preview-panel">
        <span className="eyebrow">SOURCE & RIGHTS</span>
        <h3>Kiểm tra dữ kiện</h3>
        <div className="script-line">
          <b>PRODUCT</b>
          <p>{name || "Chưa nhập tên sản phẩm"}</p>
        </div>
        <div className="script-line">
          <b>CLAIM EVIDENCE</b>
          <p>
            {claim || "Chưa có claim"}
            {claim && claim !== attribute && (
              <small className="warning">
                Claim cần trùng dữ kiện có bằng chứng.
              </small>
            )}
          </p>
        </div>
        <div className="script-line">
          <b>MEDIA</b>
          <p>
            Chỉ chọn hình học tổng hợp OFFLINE_DEMO_ONLY. Chưa có media thương
            mại được cấp quyền.
          </p>
        </div>
        <div className="notice">
          Giá tiền không được sử dụng khi thiếu chứng cứ giá riêng và thời hạn
          24 giờ. Không tuyên bố đã dùng thử.
        </div>
        <div className="budget-line">
          <span>Ước tính trần (chưa chi)</span>
          <b>≤ $0.08</b>
        </div>
      </section>
    </div>
  );
}
function Review({
  job,
  busy,
  review,
}: {
  job: Job;
  busy: boolean;
  review: (d: "APPROVE" | "REJECT", n: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const captions = job.captions
    .map(
      (c) =>
        `${Math.floor(c.startFrame / 30)}s–${Math.floor(c.endFrame / 30)}s  ${c.text}`,
    )
    .join("\n");
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([captions || job.script.join("\n")], { type: "text/plain" }),
    );
    a.download = job.id + "-captions.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  };
  return (
    <div className="split review-layout">
      <section className="panel">
        <span className="eyebrow">
          {job.fixture ? "VERIFIED OFFLINE FIXTURE" : "UNRENDERED DRAFT"}
        </span>
        <h3>{job.title}</h3>
        {job.mediaAvailable ? (
          <div className="video-frame">
            <video
              key={job.id}
              controls
              preload="metadata"
              playsInline
              src={"/api/jobs/" + job.id + "/media"}
              aria-label={"Offline fixture " + job.title}
            />
            <span>OFFLINE FIXTURE · SYNTHETIC TONE</span>
          </div>
        ) : (
          <div className="media-absent">
            <strong>Video chưa có sẵn</strong>
            <p>Draft chưa render. Không có MP4 hoặc tiếng nói thật để phát.</p>
          </div>
        )}
        <div className="hash">
          SHA-256: {job.artifactSha256 || "Chưa có artifact"}
        </div>
        <div className="budget-line">
          <span>Trạng thái</span>
          <b>{job.status}</b>
        </div>
      </section>
      <section className="panel">
        <span className="eyebrow">REVIEW DESK</span>
        <h3>Script & QA</h3>
        <ol className="script-list">
          {job.script.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        {job.pilot && (
          <div className="notice" aria-label="Production pilot readiness">
            <strong>
              {job.pilot.productionJobId} · {job.pilot.scriptVersion}
            </strong>
            <p>
              Script:{" "}
              {job.pilot.approvedScriptSha256
                ? "Approved"
                : "PENDING OWNER APPROVAL"}
            </p>
            <p>SHA-256: {job.pilot.scriptSha256}</p>
            <p>
              Media: {job.pilot.mediaProvenance} · Audio:{" "}
              {job.pilot.audioStatus} · Render: {job.pilot.renderStatus}
            </p>
            <p>{job.pilot.voiceConfiguration.join(" / ")}</p>
            <p>
              QA: {job.pilot.qaStatus} · Owner: {job.pilot.ownerDecision}
            </p>
            <p>Paid execution DISABLED · Publication DISABLED</p>
          </div>
        )}
        <div className="qa-chips">
          {job.qa ? (
            <>
              <span>OFFLINE_FIXTURE_PASS</span>
              <span>REMOTION_RENDER_PASS</span>
              <span>AUDIO_ALIGNMENT_UNVERIFIED</span>
              <span>PRESENTER_ASSET_UNVERIFIED</span>
            </>
          ) : (
            <span>TECHNICAL_QA_NOT_EVALUATED</span>
          )}
        </div>
        <button className="secondary" onClick={download}>
          ↓ Tải captions {job.captions.length ? "theo scene" : "bản nháp"}
        </button>
        {job.status === "PENDING_OWNER_REVIEW" && (
          <div className="review-actions">
            <label className="field">
              Ghi chú đánh giá
              <textarea
                minLength={2}
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Lý do duyệt hoặc từ chối…"
              />
            </label>
            <div className="buttons">
              <button
                disabled={busy || notes.trim().length < 2}
                onClick={() => review("APPROVE", notes)}
              >
                Duyệt demo
              </button>
              <button
                disabled={busy || notes.trim().length < 2}
                className="reject"
                onClick={() => review("REJECT", notes)}
              >
                Từ chối
              </button>
            </div>
            <small>
              Duyệt demo không cho phép đăng tải hoặc sản xuất trả phí.
            </small>
          </div>
        )}
        {job.reviewNotes && (
          <div className="notice">Ghi chú đã lưu: {job.reviewNotes}</div>
        )}
      </section>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
