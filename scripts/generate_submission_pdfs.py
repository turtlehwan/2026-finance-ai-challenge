#!/usr/bin/env python3
"""Generate visual, truth-aligned submission drafts from the canonical Markdown.

The DAKER-provided HWPX templates remain the required upload base. These PDFs
preserve the same mandatory section order and provide review-ready copy and
figures for transfer into those templates.
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import (
    Flowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf"
FONT_PATH = Path("/Library/Fonts/Arial Unicode.ttf")

NAVY = colors.HexColor("#0F2E59")
BLUE = colors.HexColor("#2563EB")
PALE_BLUE = colors.HexColor("#E7F0FF")
INK = colors.HexColor("#172033")
SLATE = colors.HexColor("#526071")
MIST = colors.HexColor("#F4F7FA")
LINE = colors.HexColor("#D7DEE8")
AMBER = colors.HexColor("#C87900")
PALE_AMBER = colors.HexColor("#FFF6E5")
WHITE = colors.white


def ensure_font():
    if not FONT_PATH.exists():
        raise RuntimeError(f"Korean font was not found: {FONT_PATH}")
    pdfmetrics.registerFont(TTFont("NotoSansKR", str(FONT_PATH)))


def styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "TitleKR",
            parent=base["Title"],
            fontName="NotoSansKR",
            fontSize=25,
            leading=35,
            textColor=NAVY,
            alignment=TA_CENTER,
            spaceAfter=8 * mm,
        ),
        "subtitle": ParagraphStyle(
            "SubtitleKR",
            parent=base["Normal"],
            fontName="NotoSansKR",
            fontSize=12,
            leading=19,
            textColor=SLATE,
            alignment=TA_CENTER,
        ),
        "kicker": ParagraphStyle(
            "KickerKR",
            parent=base["Normal"],
            fontName="NotoSansKR",
            fontSize=9,
            leading=13,
            textColor=BLUE,
            alignment=TA_CENTER,
        ),
        "h1": ParagraphStyle(
            "H1KR",
            parent=base["Heading1"],
            fontName="NotoSansKR",
            fontSize=18,
            leading=26,
            textColor=NAVY,
            spaceBefore=6 * mm,
            spaceAfter=4 * mm,
        ),
        "h2": ParagraphStyle(
            "H2KR",
            parent=base["Heading2"],
            fontName="NotoSansKR",
            fontSize=13,
            leading=20,
            textColor=NAVY,
            spaceBefore=4 * mm,
            spaceAfter=2 * mm,
        ),
        "body": ParagraphStyle(
            "BodyKR",
            parent=base["BodyText"],
            fontName="NotoSansKR",
            fontSize=10,
            leading=17,
            textColor=INK,
            spaceAfter=2.5 * mm,
        ),
        "small": ParagraphStyle(
            "SmallKR",
            parent=base["BodyText"],
            fontName="NotoSansKR",
            fontSize=8,
            leading=12,
            textColor=SLATE,
        ),
        "table": ParagraphStyle(
            "TableKR",
            parent=base["BodyText"],
            fontName="NotoSansKR",
            fontSize=8.4,
            leading=12.5,
            textColor=INK,
        ),
        "table_head": ParagraphStyle(
            "TableHeadKR",
            parent=base["BodyText"],
            fontName="NotoSansKR",
            fontSize=8.4,
            leading=12,
            textColor=WHITE,
        ),
        "note": ParagraphStyle(
            "NoteKR",
            parent=base["BodyText"],
            fontName="NotoSansKR",
            fontSize=8.5,
            leading=13.5,
            textColor=colors.HexColor("#653900"),
        ),
    }


class LabelBar(Flowable):
    def __init__(self, label, width=174 * mm):
        super().__init__()
        self.label = label
        self.width = width
        self.height = 10 * mm

    def draw(self):
        self.canv.setFillColor(PALE_BLUE)
        self.canv.roundRect(0, 0, self.width, self.height, 3 * mm, fill=1, stroke=0)
        self.canv.setFillColor(BLUE)
        self.canv.setFont("NotoSansKR", 8.5)
        self.canv.drawString(4 * mm, 3.2 * mm, self.label)


class FlowDiagram(Flowable):
    """Simple vector version of the Mermaid workflow for PDF legibility."""

    def __init__(self, kind="evidence", width=174 * mm, height=72 * mm):
        super().__init__()
        self.kind = kind
        self.width = width
        self.height = height

    def _box(self, x, y, w, h, text, fill, stroke, font_size=7.2):
        self.canv.setFillColor(fill)
        self.canv.setStrokeColor(stroke)
        self.canv.setLineWidth(0.7)
        self.canv.roundRect(x, y, w, h, 3 * mm, fill=1, stroke=1)
        self.canv.setFillColor(INK)
        self.canv.setFont("NotoSansKR", font_size)
        lines = text.split("\n")
        line_h = font_size + 2.4
        start = y + h / 2 + (len(lines) - 1) * line_h / 2 - font_size * 0.35
        for index, line in enumerate(lines):
            self.canv.drawCentredString(x + w / 2, start - index * line_h, line)

    def _arrow(self, x1, y1, x2, y2, label=None):
        self.canv.setStrokeColor(colors.HexColor("#718096"))
        self.canv.setFillColor(colors.HexColor("#718096"))
        self.canv.setLineWidth(0.8)
        self.canv.line(x1, y1, x2, y2)
        self.canv.saveState()
        self.canv.translate(x2, y2)
        self.canv.rotate(90 if abs(y2 - y1) > abs(x2 - x1) and y2 > y1 else -90 if abs(y2 - y1) > abs(x2 - x1) else 0)
        path = self.canv.beginPath()
        path.moveTo(0, 0)
        path.lineTo(-4, 2.2)
        path.lineTo(-4, -2.2)
        path.close()
        self.canv.drawPath(path, fill=1, stroke=0)
        self.canv.restoreState()
        if label:
            self.canv.setFillColor(SLATE)
            self.canv.setFont("NotoSansKR", 6.5)
            self.canv.drawCentredString((x1 + x2) / 2, (y1 + y2) / 2 + 3, label)

    def draw(self):
        if self.kind == "evidence":
            w, h = 30 * mm, 14 * mm
            nodes = [
                (0, 48 * mm, "문서 사실\n추출", MIST, LINE),
                (36 * mm, 48 * mm, "사건 분석\nLangGraph", PALE_BLUE, BLUE),
                (72 * mm, 48 * mm, "가입일 기준\n약관 버전", MIST, LINE),
                (108 * mm, 48 * mm, "보장 항목\n대조", PALE_BLUE, BLUE),
                (144 * mm, 48 * mm, "근거 감사\n면책 포함", MIST, LINE),
            ]
            for x, y, text, fill, stroke in nodes:
                self._box(x, y, w, h, text, fill, stroke)
            for index in range(len(nodes) - 1):
                self._arrow(nodes[index][0] + w, nodes[index][1] + h / 2, nodes[index + 1][0], nodes[index + 1][1] + h / 2)
            self._box(50 * mm, 16 * mm, 36 * mm, 14 * mm, "사실 부족\n추가 질문", PALE_AMBER, AMBER)
            self._box(108 * mm, 16 * mm, 48 * mm, 14 * mm, "확인 항목·서류\n공식 경로", PALE_BLUE, BLUE)
            self._arrow(123 * mm, 48 * mm, 123 * mm, 30 * mm, "충분")
            self._arrow(103 * mm, 48 * mm, 68 * mm, 30 * mm, "부족")
            self._arrow(86 * mm, 23 * mm, 108 * mm, 23 * mm)
        else:
            self._box(0, 48 * mm, 46 * mm, 15 * mm, "공식 실제 약관\n2개 상품·3개 버전", PALE_BLUE, BLUE)
            self._box(56 * mm, 48 * mm, 46 * mm, 15 * mm, "비식별 합성\n보험가입증서·진료자료", MIST, LINE)
            self._box(112 * mm, 48 * mm, 62 * mm, 15 * mm, "결정론적 근거 그래프\n조항·쪽수·출처", PALE_BLUE, BLUE)
            self._arrow(46 * mm, 55.5 * mm, 56 * mm, 55.5 * mm)
            self._arrow(102 * mm, 55.5 * mm, 112 * mm, 55.5 * mm)
            self._box(0, 14 * mm, 52 * mm, 15 * mm, "사용자 명시 동의\n원본 PDF·이미지", PALE_AMBER, AMBER)
            self._box(62 * mm, 14 * mm, 52 * mm, 15 * mm, "Workers AI 변환\n저장 없이 브라우저 반환", PALE_AMBER, AMBER)
            self._box(124 * mm, 14 * mm, 50 * mm, 15 * mm, "마스킹 미리보기\n누락 사실 후보만", PALE_AMBER, AMBER)
            self._arrow(52 * mm, 21.5 * mm, 62 * mm, 21.5 * mm)
            self._arrow(114 * mm, 21.5 * mm, 124 * mm, 21.5 * mm)
            self._arrow(143 * mm, 29 * mm, 143 * mm, 48 * mm)


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 14 * mm, A4[0] - 18 * mm, 14 * mm)
    canvas.setFillColor(SLATE)
    canvas.setFont("NotoSansKR", 7.5)
    canvas.drawString(18 * mm, 8.5 * mm, "보험금 길잡이 Agent · 2026 금융 AI Challenge 예선 제출용 초안")
    canvas.drawRightString(A4[0] - 18 * mm, 8.5 * mm, f"{doc.page} / {{total}}")
    canvas.restoreState()


class NumberedCanvas(Canvas):
    """Draw total page count after the document is built."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        count = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.setStrokeColor(LINE)
            self.line(18 * mm, 14 * mm, A4[0] - 18 * mm, 14 * mm)
            self.setFillColor(SLATE)
            self.setFont("NotoSansKR", 7.5)
            self.drawString(18 * mm, 8.5 * mm, "보험금 길잡이 Agent · 2026 금융 AI Challenge 예선 제출용 초안")
            self.drawRightString(A4[0] - 18 * mm, 8.5 * mm, f"{self._pageNumber} / {count}")
            super().showPage()
        super().save()


def paragraph(text, s):
    return Paragraph(text, s["body"])


def title_page(title, subtitle, s):
    return [
        Spacer(1, 44 * mm),
        Paragraph("2026 금융 AI Challenge", s["kicker"]),
        Spacer(1, 5 * mm),
        Paragraph(title, s["title"]),
        Paragraph(subtitle, s["subtitle"]),
        Spacer(1, 22 * mm),
        LabelBar("근거는 명확하게 · 판단은 사람에게 · 실행은 공식 채널에서"),
        Spacer(1, 10 * mm),
        Paragraph("문서 상태: 예선 제출용 검토 초안 · 기준일: 2026-08-05", s["small"]),
        Spacer(1, 2 * mm),
        Paragraph("제출 전 DAKER 제공 HWPX 양식의 팀명·팀원 항목을 입력하고 PDF로 변환합니다.", s["small"]),
        PageBreak(),
    ]


def section(title, s):
    return [Spacer(1, 1 * mm), Paragraph(title, s["h1"])]


def bullet(items, s):
    return [Paragraph(f"• {item}", s["body"]) for item in items]


def table(rows, widths, s):
    content = []
    for row_index, row in enumerate(rows):
        style = s["table_head"] if row_index == 0 else s["table"]
        content.append([Paragraph(cell, style) for cell in row])
    result = Table(content, colWidths=widths, repeatRows=1, hAlign="LEFT")
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3.2 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3.2 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 2.4 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.4 * mm),
    ]
    for index in range(1, len(content)):
        if index % 2 == 0:
            style.append(("BACKGROUND", (0, index), (-1, index), MIST))
    result.setStyle(TableStyle(style))
    return result


def callout(text, s):
    content = Table([[Paragraph(text, s["note"])]], colWidths=[174 * mm])
    content.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE_AMBER),
        ("BOX", (0, 0), (-1, -1), 0.45, AMBER),
        ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
    ]))
    return content


def build_proposal(path):
    s = styles()
    story = title_page("보험금 길잡이 Agent", "고령 부모의 보험을 대신 챙기는 가족을 위한\n보험약관 근거 기반 확인·행동 Agent", s)

    story += section("1. 서비스 명칭", s)
    story += [paragraph("<b>보험금 길잡이 Agent</b><br/>고령 부모의 보험을 대신 챙기는 가족을 위한 보험약관 근거 기반 보험금 확인·행동 Agent", s)]
    story += section("2. 아이디어 기획 핵심내용", s)
    story += bullet([
        "보험가입증서·진료자료·사고 설명을 연결해 사용자가 확인해 볼 보장 항목을 선별합니다.",
        "상품코드와 가입일을 기준으로 가입 당시 적용된 실제 보험약관 버전을 찾습니다.",
        "정의·지급·제한·면책을 결정론적 근거 그래프로 함께 확인하고, 근거가 부족하면 결론을 만들지 않습니다.",
        "부족한 사실은 Agent가 질문하고, 사용자는 근거·필요 서류·공식 청구 경로를 한 흐름에서 확인합니다.",
        "AI가 지급 여부나 금액을 정하지 않으며, 최종 판단과 청구는 사용자가 보험사 공식 채널에서 수행합니다.",
    ], s)
    story += section("3. 문제 정의 및 제안 배경", s)
    story += [paragraph("보험금 미청구는 조회 채널의 부재만으로 설명되지 않습니다. 금융위원회는 보험금 발생 사실을 알지 못하거나 이자 조건을 오해하는 경우를 원인으로 제시했습니다. 2026년 7월 발표 기준 찾아가야 할 숨은보험금은 10.3조 원이며, 2025년에만 약 80만 건·3조 2,447억 원이 환급됐습니다.", s)]
    story += bullet([
        "보험금 청구 절차가 불편하다는 응답: 단일응답 39.7%, 복수응답 52.5%",
        "보험금 지급 과정 안내가 부족하다는 응답: 54.7%",
        "보험금 지급 내역 안내가 부족하다는 응답: 51.4%",
    ], s)
    story += [paragraph("1차 고객은 고령 부모의 보험을 대신 챙기는 가족 보호자입니다. 이들은 여러 보험가입증서의 보장 내용과 치료 사실을 대조하고, 가입 당시 보험약관의 예외까지 확인해야 합니다. 서비스는 내보험찾아줌·실손24와 경쟁하지 않고, 공식 조회·청구 전에 확인할 항목과 준비 자료를 정리하는 사전 확인 채널로 동작합니다.", s)]
    story += [callout("<b>문제의 핵심</b> · ‘받을 수 있는 돈을 계산’하는 것이 아니라, 복잡한 서류와 가입 당시 보험약관을 대조해 사용자가 ‘무엇을 확인해야 하는지’를 놓치지 않게 하는 일입니다.", s), PageBreak()]

    story += section("4. 서비스 컨셉 및 차별성", s)
    story += [paragraph("<b>보험은 사람이 결정하고, Agent는 놓치지 않게 돕습니다.</b> 보험금 길잡이 Agent는 약관에 한 번 답하는 챗봇이 아닙니다. 사건을 목표로 문서를 구조화하고, 적용 버전을 확인하고, 필요한 사실을 질문하고, 검증된 다음 행동을 준비하는 Agentic 금융 업무 흐름입니다.", s)]
    story += [FlowDiagram("evidence"), Paragraph("그림 1. Agentic 근거 확인 흐름. 화면의 LangFlow형 캔버스는 실제 LangGraph 실행 trace가 발생한 노드만 활성화해 보여 줍니다.", s["small"])]
    story += bullet([
        "<b>가입 시점 기준 버전 선택</b>: 최신 약관이 아닌 상품코드와 계약일에 맞는 적용 보험약관을 우선 확정합니다.",
        "<b>결정론적 근거 그래프</b>: 구조화된 조항 ID와 관계를 따라 정의·지급·제한·면책을 함께 연결합니다.",
        "<b>근거가 부족하면 멈춤</b>: 필수 사실이 없으면 Human-in-the-loop 질문으로 전환하고, 근거 검증 실패 시 확인 불가로 종료합니다.",
        "<b>적응형 비서 UI</b>: 결과 요약·근거 약관·준비 서류·실행 과정 가운데 지금 필요한 컴포넌트만 전면에 배치합니다.",
    ], s)
    story += [PageBreak()]
    story += section("5. 활용 데이터 및 생성형 AI 모델 적용 방안", s)
    story += [paragraph("예선 MVP가 결과 근거로 직접 연결하는 공식 실제 상품 약관은 2개 상품·3개 버전입니다. 개인 보험가입증서와 진료자료는 비식별 합성 데이터로 시연하고, 사용자가 직접 넣는 문서는 비저장 원칙으로 처리합니다.", s)]
    story += [table([
        ["공식 약관", "상품코드·판매기간", "실제 분석 사례"],
        ["무배당 우체국와이드건강보험 2112", "P400051~054<br/>2021-12-01~2025-04-02", "S52 골절 특약"],
        ["무배당 우체국와이드건강보험 2504", "P400073~076<br/>2025-04-03~2025-06-04", "S52 골절 특약"],
        ["무배당 우체국온라인입원수술보험 2112", "P600107<br/>2021-12-01~2025-04-02", "4일 이상 입원·수술 확인"],
    ], [62 * mm, 56 * mm, 56 * mm], s)]
    story += [Spacer(1, 3 * mm), FlowDiagram("boundary"), Paragraph("그림 2. 실제 데이터와 외부 AI 처리 경계. 원본 PDF·이미지는 사용자의 명시 동의가 있을 때만 Workers AI 문서 변환에 전송됩니다.", s["small"]), PageBreak()]

    story += section("5. 활용 데이터 및 생성형 AI 모델 적용 방안 (계속)", s)
    story += bullet([
        "<b>기본 경로</b>: 규칙 기반 파싱, 개인정보 마스킹, 상품·가입일 기반 버전 계산, 결정론적 근거 그래프, Evidence Auditor를 실행합니다.",
        "<b>선택형 AI 문서 변환</b>: 사용자가 동의하면 Cloudflare Workers AI Markdown Conversion이 PDF·JPG·PNG·WEBP를 텍스트화합니다. 원본은 서비스 DB·파일시스템에 저장하지 않습니다.",
        "<b>제한형 LLM 도구</b>: 마스킹된 미리보기만 `@cf/meta/llama-3.1-8b-instruct-fast` JSON Mode에 전달해 누락 사실 후보와 짧은 확인 질문을 받습니다.",
        "<b>AI가 하지 않는 일</b>: 보험금 지급 판단, 약관 검색·인용, 임베딩 검색, Hybrid RAG, 지급액 계산을 맡기지 않습니다.",
    ], s)
    story += [callout("<b>정직성 고지</b> · 현재 MVP의 보험약관 선택과 근거 인용은 코드의 결정론적 관계 탐색이 수행합니다. LLM 응답만으로 보장 상태·적용 버전·조항 인용을 만들 수 없습니다.", s)]
    story += section("6. 기대 효과 및 확장 가능성", s)
    story += bullet([
        "가족 보호자가 보험사 문의 전에 확인 가능한 사실, 근거 조항, 필요한 서류를 한 번에 준비합니다.",
        "가입 시점이 다른 계약에 각각 맞는 버전을 연결해 최신 약관 오인 위험을 줄입니다.",
        "공식 실행 경로를 연결해 서비스가 청구 대행·손해사정·상품 권유 영역으로 넘어가지 않습니다.",
        "새 공식 문서는 해시·시행일·조항 비교, 회귀 평가, 사람 승인 후 반영하는 PolicyOps 방식으로 확장합니다.",
        "보험 외에도 복지급여·의료비 지원처럼 ‘조건·문서·공식 절차’를 연결해야 하는 포용 서비스에 응용할 수 있습니다.",
    ], s)
    story += section("7. 기타 - 검증 범위와 한계", s)
    story += [table([
        ["항목", "예선 MVP의 현재 범위"],
        ["공식 근거", "우체국보험 2개 상품·3개 버전의 조항·페이지·해시와 출처 URL을 결과에 연결"],
        ["평가", "결정론적 회귀 fixture 50건과 생성 규칙에서 분리한 수작업 라벨 holdout 15건. 두 집합 모두 합성 사실관계"],
        ["문서 입력", "AI 보조 해제 시 텍스트 레이어 PDF·TXT. 동의 시 PDF·JPG·PNG·WEBP 변환. 저해상도·손상·복잡한 표는 실패 가능"],
        ["최종 판단", "보험사 청구 이력·지급심사·확정 금액을 조회하지 않으며, 최종 지급 여부는 보험회사가 결정"],
    ], [45 * mm, 129 * mm], s)]
    make_document(path, story)


def build_feature_spec(path):
    s = styles()
    story = title_page("보험금 길잡이 Agent", "2026 금융 AI Challenge\nMVP 기능명세서", s)
    story += section("1. MVP 구현 범위", s)
    story += bullet([
        "공식 우체국보험 2개 상품·3개 버전과 비식별 합성 사례 4종을 연결합니다.",
        "상품코드·가입일 기반 보험약관 버전 선택, 조항·페이지·해시 provenance, 정의·지급·제한·면책 관계 탐색을 실행합니다.",
        "사용자 문서의 사실을 구조화하고, 정보 부족 시 Human-in-the-loop 질문으로 중단·재개합니다.",
        "실제 LangGraph trace를 React Flow의 LangFlow형 실행 캔버스에 노드별 입력·출력·상태·소요시간으로 표시합니다.",
        "동의형 Workers AI 문서 변환과 마스킹된 누락 사실 후보 JSON 도구를 제한적으로 제공합니다.",
        "결정론적 회귀 50건과 분리된 수작업 라벨 holdout 15건의 범위·지표·한계를 화면에 공개합니다.",
    ], s)
    story += [callout("<b>구현 경계</b> · 현재 런타임은 임베딩 검색·Hybrid RAG·범용 LLM 기반 약관 검색을 수행하지 않습니다. 약관 버전과 인용은 결정론적 근거 그래프가 담당합니다.", s)]
    story += section("2. 주요 기능 목록", s)
    story += [table([
        ["기능명", "실제 동작", "관련 화면", "상태"],
        ["약관 버전 선택", "상품코드·가입일과 공식 판매기간 대조", "문서 입력·분석", "완료"],
        ["근거 그래프", "정의·지급·제한·면책·서류 조항을 관계로 확장", "분석 결과", "완료"],
        ["Evidence Audit", "버전·인용·면책 동반·공식 출처 검증, 실패 시 안전 중단", "분석 결과", "완료"],
        ["Human-in-the-loop", "수술·기존 청구 등 필수 사실을 질문하고 답변 뒤 재실행", "정보 확인", "완료"],
        ["실행 캔버스", "실제 trace의 노드별 입력·출력·상태·소요시간 시각화", "분석 과정", "완료"],
        ["AI 문서 변환", "동의 시 PDF·JPG·PNG·WEBP를 Workers AI로 텍스트화", "문서 입력", "완료"],
        ["제한형 LLM 도구", "마스킹 미리보기에서 누락 사실 후보·질문만 JSON 생성", "문서 입력·trace", "완료"],
        ["평가 공개", "50건 회귀와 15건 수작업 라벨 holdout의 분리 결과·한계", "내부 평가", "완료"],
        ["공식 경로", "필요 서류·확인 질문과 내보험찾아줌·실손24 안내", "다음 행동", "완료"],
    ], [33 * mm, 79 * mm, 38 * mm, 24 * mm], s)]
    story += [PageBreak()]

    story += section("3. 사용자 이용 흐름", s)
    story += [table([
        ["순서", "사용자 행동", "시스템 반응"],
        ["1", "배포 URL에 접속하고 큰글씨 설정을 선택", "320px 이상 모바일부터 데스크톱까지 같은 4단계 흐름 제공"],
        ["2", "합성 사례를 고르거나 문서를 1~2개 입력", "기본은 텍스트 레이어 PDF·TXT. AI 동의 시 PDF·이미지 변환"],
        ["3", "‘이 사례 분석하기’ 또는 ‘분석 시작해줘’ 실행", "사건 분석·문서 사실·적용 버전·보장 대조를 실제 LangGraph가 수행"],
        ["4", "추가 질문에 답변", "필수 사실 부족 시 멈추고, 답변 뒤 근거 감사 경로를 재실행"],
        ["5", "결과·근거·서류·분석 과정 중 필요한 보기 선택", "하나의 컴포넌트를 전면으로 가져오고, 근거·한계·다음 행동을 함께 표시"],
        ["6", "공식 채널로 이동", "보험사 공식 채널에서 실제 조회·청구를 사용자가 직접 실행"],
    ], [14 * mm, 72 * mm, 88 * mm], s)]
    story += [Spacer(1, 5 * mm), FlowDiagram("evidence"), Paragraph("그림 1. 실제 trace 기반 Agent 실행 캔버스의 읽기 순서", s["small"]), PageBreak()]
    story += section("4. AI 및 데이터 처리 방식", s)
    story += [FlowDiagram("boundary"), Paragraph("그림 2. 실제 데이터와 선택형 AI 처리 경계", s["small"])]
    story += bullet([
        "공식 데이터: P400051~054 / 2112, P400073~076 / 2504, P600107 / 2112의 공식 약관·판매기간·조항·페이지와 해시.",
        "데모 데이터: 보험가입증서·진료자료·사고 사실은 비식별 합성. 실고객 청구·지급·진료 이력은 사용하지 않음.",
        "기본 처리: 규칙 기반 사실 추출, 개인정보 마스킹, 결정론적 버전 선택과 조항 관계 탐색, Evidence Audit.",
        "AI 동의 처리: 원본 PDF·이미지는 Workers AI Markdown Conversion에 전송. 이후 일반 LLM 도구에는 서버 측 재마스킹까지 적용한 미리보기만 전달.",
        "AI 출력 제한: 누락 사실 후보·짧은 질문만. 보장 상태·약관 인용·금액·지급 판단은 코드가 아닌 LLM 응답으로 만들 수 없음.",
    ], s)
    story += [callout("<b>개인정보 처리</b> · 업로드 원본은 서비스 파일시스템·DB·모델 학습에 저장하지 않습니다. 다만 AI 보조를 켜면 원본 문서가 외부 Cloudflare Workers AI 변환에 전송되므로, 토글에서 명시 동의를 받습니다.", s), PageBreak()]

    story += section("5. MVP 검증 방법", s)
    story += [table([
        ["검증 항목", "심사자 확인 절차", "예상 결과"],
        ["공식 골절 근거", "공식 약관 연결 샘플을 불러오고 손목 골절 사례 실행", "P400073 / 2504와 조항·페이지·면책 동반 근거 표시"],
        ["구버전 선택", "P400051 계약일 사례 실행", "같은 골절이라도 2112 버전의 근거로 전환"],
        ["입원·수술 구분", "5일 입원 사례 실행 후 수술 여부 질문에 답변", "P600107 / 2112의 4일 이상 입원 요건과 수술 기록 필요를 구분"],
        ["안전 중단", "면책 함정 사례에서 ‘잘 모르겠어요’ 선택", "보상 조항만으로 단정하지 않고 정보 필요 또는 확인 불가"],
        ["AI 보조", "비식별 합성 PDF·이미지로 AI 보조 토글을 켬", "동의 고지, 변환 결과 또는 안전한 실패 안내. 해제 시 텍스트 레이어 PDF·TXT만 처리"],
        ["평가", "내부 평가 카드 확인", "50건 회귀와 15건 holdout을 분리 표시하고 실제 지급 정확도 아님을 고지"],
        ["반응형", "320·390·1024·1440px에서 확인", "가로 스크롤 없이 재배치, 14px 최소 글자와 큰글씨 모드 유지"],
    ], [32 * mm, 82 * mm, 60 * mm], s)]
    story += section("MVP 제한사항", s)
    story += bullet([
        "공식 근거는 2개 상품·3개 버전으로 한정됩니다. 다른 보험사·상품 일반화를 주장하지 않습니다.",
        "AI 보조를 끄면 텍스트 레이어 PDF·TXT만 처리합니다. AI 변환은 저해상도·손상 문서·복잡한 표에서 실패할 수 있습니다.",
        "50건 회귀와 15건 holdout은 합성 사실관계입니다. 실제 고객 분포·보험금 지급 정확도·보험사 심사를 대표하지 않습니다.",
        "보험사의 청구 이력·지급심사·확정 금액을 조회하지 않으며, 최종 지급 여부는 보험회사가 결정합니다.",
        "음성 입력은 Web Speech API 지원 브라우저에서만 보조적으로 제공하며, 텍스트 입력으로 전체 흐름을 완료할 수 있습니다.",
    ], s)
    story += [Spacer(1, 5 * mm), paragraph("배포 URL: https://finai26.turtlehwan.dev<br/>권장 브라우저: 최신 Chrome, Safari, Edge · 테스트 계정: 필요 없음", s)]
    make_document(path, story)


def make_document(path, story):
    path.parent.mkdir(parents=True, exist_ok=True)
    document = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=22 * mm,
        title="보험금 길잡이 Agent",
        author="2026 금융 AI Challenge 팀",
    )
    document.build(story, canvasmaker=NumberedCanvas)


if __name__ == "__main__":
    ensure_font()
    build_proposal(OUTPUT / "2026-finance-ai-challenge-proposal-draft.pdf")
    build_feature_spec(OUTPUT / "2026-finance-ai-challenge-feature-specification-draft.pdf")
