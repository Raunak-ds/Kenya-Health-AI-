"""
PDF Report generation for crop health diagnosis scans.
Built using ReportLab.
"""
from io import BytesIO
from datetime import datetime
from typing import Optional, Dict, Any

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable


def generate_scan_pdf_report(
    farmer_name: str,
    farm_name: Optional[str],
    county: Optional[str],
    plot_crop: Optional[str],
    scan_date: datetime,
    prediction_label: str,
    confidence: Optional[float],
    severity_category: Optional[str],
    affected_percent: Optional[float],
    recommendations: Optional[Dict[str, Any]],
    model_version_str: str = "EfficientNet-B0 v1.0.0",
    expert_verification: Optional[Dict[str, Any]] = None,
) -> bytes:
    """
    Generate a clean, professional agricultural diagnostic PDF report.
    Returns bytes of PDF.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1b4332"),  # Deep Forest Green
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#2d6a4f"),
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1b4332"),
        spaceBefore=10,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#212529"),
    )
    bullet_style = ParagraphStyle(
        "BulletText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#212529"),
        leftIndent=12,
        firstLineIndent=-12,
        spaceAfter=3,
    )
    disclaimer_style = ParagraphStyle(
        "DisclaimerText",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#6c757d"),
    )

    story = []

    # 1. Header
    story.append(Paragraph("KENYA CROP HEALTH MANAGEMENT PLATFORM", title_style))
    story.append(Paragraph("AI-Assisted Crop Disease Diagnosis & Agronomic Advisory Report", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#2d6a4f"), spaceAfter=12))

    # 2. Summary Details Table
    clean_label = prediction_label.replace("_", " ").title() if prediction_label else "Unknown"
    conf_str = f"{(confidence * 100):.1f}%" if confidence else "N/A"
    sev_str = severity_category or "N/A"
    area_str = f"{affected_percent:.1f}%" if affected_percent is not None else "N/A"
    date_str = scan_date.strftime("%d %b %Y, %H:%M UTC")

    meta_data = [
        [Paragraph("<b>Farmer:</b>", body_style), Paragraph(farmer_name, body_style),
         Paragraph("<b>Scan Date:</b>", body_style), Paragraph(date_str, body_style)],
        [Paragraph("<b>Farm:</b>", body_style), Paragraph(farm_name or "General / Unassigned", body_style),
         Paragraph("<b>County:</b>", body_style), Paragraph(county or "Not specified", body_style)],
        [Paragraph("<b>Crop Screened:</b>", body_style), Paragraph(plot_crop or "Leaf Scan", body_style),
         Paragraph("<b>Model Version:</b>", body_style), Paragraph(model_version_str, body_style)],
    ]

    t_meta = Table(meta_data, colWidths=[90, 180, 80, 180])
    t_meta.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8f9fa")),
        ("PADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dee2e6")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # 3. AI Prediction Card Table
    diag_data = [
        [
            Paragraph("<b>Predicted Condition</b>", body_style),
            Paragraph("<b>Confidence</b>", body_style),
            Paragraph("<b>Severity Band</b>", body_style),
            Paragraph("<b>Affected Area (Est.)</b>", body_style),
        ],
        [
            Paragraph(f"<font color='#1b4332' size=11><b>{clean_label}</b></font>", body_style),
            Paragraph(f"<b>{conf_str}</b>", body_style),
            Paragraph(f"<b>{sev_str}</b>", body_style),
            Paragraph(f"<b>{area_str}</b>", body_style),
        ]
    ]
    t_diag = Table(diag_data, colWidths=[200, 110, 110, 110])
    t_diag.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#d8f3dc")),
        ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#ffffff")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#74c69d")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t_diag)
    story.append(Spacer(1, 10))

    # 4. Expert Verification (if available)
    if expert_verification:
        dec = expert_verification.get("decision", "pending").title()
        notes = expert_verification.get("notes", "No notes recorded.")
        corr = expert_verification.get("corrected_label")
        exp_text = f"<b>Decision:</b> {dec}"
        if corr:
            exp_text += f" | <b>Expert Corrected Label:</b> {corr.replace('_', ' ').title()}"
        exp_text += f"<br/><b>Officer Notes:</b> {notes}"

        t_exp = Table([[
            Paragraph(f"<b>EXTENSION OFFICER VERIFICATION:</b><br/>{exp_text}", body_style)
        ]], colWidths=[530])
        t_exp.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#e7f5ff")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#339af0")),
            ("PADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(t_exp)
        story.append(Spacer(1, 10))

    # 5. Recommendations Sections
    recs = recommendations or {}

    mgmt_items = recs.get("management", [])
    if mgmt_items:
        story.append(Paragraph("WHAT TO DO NOW (Immediate Management)", section_heading))
        for item in mgmt_items:
            story.append(Paragraph(f"•  {item}", bullet_style))
        story.append(Spacer(1, 6))

    prev_items = recs.get("prevention", [])
    if prev_items:
        story.append(Paragraph("PREVENTION & CULTURAL CONTROL", section_heading))
        for item in prev_items:
            story.append(Paragraph(f"•  {item}", bullet_style))
        story.append(Spacer(1, 6))

    mon_items = recs.get("monitoring", [])
    if mon_items:
        story.append(Paragraph("SCOUTING & MONITORING", section_heading))
        for item in mon_items:
            story.append(Paragraph(f"•  {item}", bullet_style))
        story.append(Spacer(1, 6))

    esc_items = recs.get("escalation", [])
    if esc_items:
        story.append(Paragraph("WHEN TO GET EXPERT HELP (Escalation Criteria)", section_heading))
        for item in esc_items:
            story.append(Paragraph(f"•  {item}", bullet_style))
        story.append(Spacer(1, 6))

    kenya_notes = recs.get("kenya_notes")
    if kenya_notes:
        story.append(Paragraph("KENYA-SPECIFIC CONTEXT", section_heading))
        story.append(Paragraph(kenya_notes, body_style))
        story.append(Spacer(1, 6))

    sources = recs.get("sources", [])
    if sources:
        story.append(Paragraph("SOURCES & CITATIONS", section_heading))
        for s in sources:
            story.append(Paragraph(f"•  {s}", bullet_style))
        story.append(Spacer(1, 6))

    # Safety policy
    safety = recs.get("safety")
    if safety:
        t_safe = Table([[Paragraph(f"<b>Chemical Stewardship Policy:</b> {safety}", body_style)]], colWidths=[530])
        t_safe.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fff3cd")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#ffeeba")),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t_safe)
        story.append(Spacer(1, 8))

    # Disclaimer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#ced4da"), spaceAfter=6))
    story.append(Paragraph(
        "<b>DISCLAIMER:</b> AI crop diagnosis provides decision support based on automated image analysis and should support, not replace, professional agricultural advice. "
        "Laboratory diagnosis is required for conclusive phytopathological determination. Always consult your Sub-County Agricultural Officer before applying agrochemicals.",
        disclaimer_style
    ))

    doc.build(story)
    return buffer.getvalue()
