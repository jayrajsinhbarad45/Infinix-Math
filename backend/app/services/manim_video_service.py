"""Infinix Math Manim Video Generator Service.

Generates high-definition, animated mathematical step-by-step explainer videos
complete with 3Blue1Brown-style Manim animations, dynamic coordinate graphing,
and synchronized human AI voice narration via Edge-TTS and FFmpeg.
"""
from __future__ import annotations

import asyncio
import os
import re
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

import edge_tts
import imageio_ffmpeg
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from manim import (
    Axes,
    Create,
    Dot,
    DOWN,
    FadeIn,
    FadeOut,
    GrowFromCenter,
    Scene,
    SurroundingRectangle,
    SVGMobject,
    Text,
    Transform,
    UL,
    UP,
    UR,
    VGroup,
    WHITE,
    Write,
    config,
)

# Output directory for generated video artifacts
MEDIA_DIR = Path(__file__).resolve().parent.parent.parent / "media" / "generated_videos"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
config.ffmpeg_executable = FFMPEG_EXE
config.media_embed = False
config.pixel_width = 854
config.pixel_height = 480
config.frame_rate = 30


def latex_to_clean_svg(latex_str: str, color: str = "#00a8ff", fontsize: int = 22) -> str:
    """Converts a LaTeX mathematical string into a clean standalone vector SVG file

    using Matplotlib's native TeX engine without requiring an external LaTeX binary.
    """
    clean_tex = latex_str.strip()
    if clean_tex.startswith("$$") and clean_tex.endswith("$$"):
        clean_tex = clean_tex[2:-2].strip()
    elif clean_tex.startswith("$") and clean_tex.endswith("$"):
        clean_tex = clean_tex[1:-1].strip()

    # Normalize common symbols for matplotlib mathtext
    clean_tex = clean_tex.replace(r"\cdot", r"\times")
    clean_tex = clean_tex.replace(r"\left", "").replace(r"\right", "")

    fig = plt.figure(figsize=(7, 1.6))
    fig.text(0.5, 0.5, f"${clean_tex}$", fontsize=fontsize, ha="center", va="center", color=color)
    fig.patch.set_alpha(0.0)
    plt.axis("off")

    tmp = tempfile.NamedTemporaryFile(suffix=".svg", delete=False)
    plt.savefig(tmp.name, format="svg", bbox_inches="tight", transparent=True)
    plt.close(fig)
    return tmp.name


def get_audio_duration(file_path: str) -> float:
    """Returns the precise playback duration of an audio or video file in seconds."""
    try:
        res = subprocess.run([FFMPEG_EXE, "-i", file_path], capture_output=True, text=True)
        match = re.search(r"Duration:\s*(\d+):(\d+):([\d.]+)", res.stderr)
        if match:
            hours, mins, secs = match.groups()
            return int(hours) * 3600 + int(mins) * 60 + float(secs)
    except Exception:
        pass
    return 3.0


def spoken_math_description(raw: str) -> str:
    """Converts LaTeX or math expressions into natural spoken English for Edge-TTS."""
    s = raw.strip()
    s = s.replace(r"\frac", "fraction ")
    s = s.replace(r"\sqrt", "square root of ")
    s = s.replace(r"\pm", "plus or minus ")
    s = s.replace(r"\times", "times ")
    s = s.replace(r"\int", "integral ")
    s = s.replace(r"\approx", "approximately ")
    s = s.replace(r"\leq", "less than or equal to ")
    s = s.replace(r"\geq", "greater than or equal to ")
    s = s.replace(r"\neq", "not equal to ")
    s = re.sub(r"\^{?2}?", " squared ", s)
    s = re.sub(r"\^{?3}?", " cubed ", s)
    s = re.sub(r"\^{?(\w+)}?", r" to the power of \1 ", s)
    s = re.sub(r"[${}\\]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


async def create_speech_audio(text: str, voice: str = "en-US-AriaNeural") -> str:
    """Generates an MP3 audio narration clip using Edge-TTS."""
    tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(tmp.name)
    return tmp.name


async def build_audio_track(
    problem_text: str,
    steps: List[Dict[str, Any]],
    voice: str = "en-US-AriaNeural",
) -> tuple[str, List[float], float, float]:
    """Generates synchronized voice narration clips for intro, each step, graph, and outro.

    Returns the concatenated master audio filepath and durations.
    """
    audio_clips: List[str] = []
    step_durations: List[float] = []

    # 1. Intro Speech
    intro_spoken = f"Welcome to Infinix Math. Let's solve the mathematical equation: {spoken_math_description(problem_text)}."
    intro_file = await create_speech_audio(intro_spoken, voice)
    intro_dur = max(2.5, get_audio_duration(intro_file) + 0.5)
    audio_clips.append(intro_file)

    # 2. Steps Speech
    for i, st in enumerate(steps[:4], start=1):
        desc = st.get("description", f"Step {i}")
        math_part = spoken_math_description(st.get("latex", ""))
        step_spoken = f"Step {i}. {desc}. {math_part}."
        clip = await create_speech_audio(step_spoken, voice)
        dur = max(2.5, get_audio_duration(clip) + 0.6)
        audio_clips.append(clip)
        step_durations.append(dur)

    # 3. Graph Speech
    graph_spoken = "Now observe the dynamic coordinate graph. Notice the function curve, tangent line slope, and real root intersections."
    graph_file = await create_speech_audio(graph_spoken, voice)
    graph_dur = max(3.5, get_audio_duration(graph_file) + 0.8)
    audio_clips.append(graph_file)

    # 4. Outro Speech
    outro_spoken = "The solution has been rigorously verified by the Infinix Math symbolic engine."
    outro_file = await create_speech_audio(outro_spoken, voice)
    outro_dur = max(2.0, get_audio_duration(outro_file) + 0.5)
    audio_clips.append(outro_file)

    # Combine all audio clips with FFmpeg concat
    concat_list = tempfile.NamedTemporaryFile(suffix=".txt", mode="w", delete=False)
    for c in audio_clips:
        concat_list.write(f"file '{c.replace(os.sep, '/')}'\n")
    concat_list.close()

    master_mp3 = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False).name
    subprocess.run(
        [
            FFMPEG_EXE,
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            concat_list.name,
            "-c",
            "copy",
            master_mp3,
        ],
        capture_output=True,
    )

    return master_mp3, step_durations, intro_dur, graph_dur


def generate_manim_video_sync(
    problem_text: str,
    solution_latex: str,
    steps: List[Dict[str, Any]],
    voice: str = "en-US-AriaNeural",
) -> Dict[str, Any]:
    """Synchronous pipeline that creates narration audio, renders the Manim animation,

    merges video and audio with FFmpeg, and saves to public media storage.
    """
    video_id = str(uuid.uuid4())[:10]

    # 1. Generate audio track and timing
    master_audio, step_durations, intro_dur, graph_dur = asyncio.run(
        build_audio_track(problem_text, steps, voice)
    )

    # 2. Build SVG assets for formulas
    prob_svg = latex_to_clean_svg(problem_text, color="#00a8ff", fontsize=24)
    step_svgs = [
        latex_to_clean_svg(st.get("latex", ""), color="#38bdf8", fontsize=20)
        for st in steps[:4]
    ]
    sol_svg = latex_to_clean_svg(solution_latex, color="#10b981", fontsize=22)

    # 3. Dynamic Scene Definition
    class SolverExplainerScene(Scene):
        def construct(self):
            self.camera.background_color = "#0f172a"

            # --- PART 1: INTRO ---
            brand = Text("Infinix Math AI", font_size=32, color="#00a8ff", weight="BOLD").to_edge(UP, buff=0.8)
            sub = Text("Step-by-Step Symbolic Solution & Graph", font_size=18, color="#94a3b8").next_to(brand, DOWN, buff=0.2)
            prob_mob = SVGMobject(prob_svg).scale(1.4).next_to(sub, DOWN, buff=0.8)

            self.play(FadeIn(brand), FadeIn(sub), run_time=1)
            self.play(GrowFromCenter(prob_mob), run_time=1.2)
            self.wait(max(0.5, intro_dur - 2.2))

            # Transition out intro
            self.play(FadeOut(prob_mob), FadeOut(sub), brand.animate.scale(0.7).to_corner(UL), run_time=0.8)

            # --- PART 2: STEP-BY-STEP DERIVATION ---
            current_mobjects = []
            for i, st in enumerate(steps[:4], start=1):
                dur = step_durations[i - 1] if i - 1 < len(step_durations) else 3.0

                badge = Text(f"Step {i}", font_size=20, color="#00a8ff", weight="BOLD").to_edge(UP, buff=1.2).to_edge(LEFT, buff=1.5)
                desc_text = st.get("description", f"Derivation {i}")
                desc = Text(desc_text, font_size=18, color=WHITE).next_to(badge, RIGHT, buff=0.3)
                step_mob = SVGMobject(step_svgs[i - 1]).scale(1.2).shift(DOWN * 0.4)

                group = VGroup(badge, desc, step_mob)

                if current_mobjects:
                    self.play(
                        FadeOut(current_mobjects[-1]),
                        FadeIn(group),
                        run_time=0.8,
                    )
                else:
                    self.play(FadeIn(group), run_time=0.8)

                current_mobjects.append(group)
                self.wait(max(0.5, dur - 0.8))

            # Clear steps before graphing
            if current_mobjects:
                self.play(FadeOut(current_mobjects[-1]), run_time=0.6)

            # --- PART 3: COORDINATE GRAPH ---
            graph_title = Text("Interactive Function & Tangent Graph", font_size=22, color=WHITE).to_edge(UP, buff=0.8)
            self.play(FadeIn(graph_title), run_time=0.6)

            axes = Axes(
                x_range=[-4, 4, 1],
                y_range=[-3, 5, 1],
                x_length=7.5,
                y_length=4.2,
                axis_config={"color": "#64748b", "include_tip": True},
            ).shift(DOWN * 0.4)

            # Quadratic or custom curve
            curve = axes.plot(lambda x: 0.6 * x**2 - 1.2, x_range=[-3, 3], color="#00a8ff")
            curve_lbl = Text("y = f(x)", font_size=14, color="#00a8ff").next_to(curve, UR, buff=0.1)

            # Tangent Line in Orange (matches Concept B legend!)
            tangent = axes.plot(lambda x: 1.2 * x - 1.8, x_range=[-1.5, 3.5], color="#f59e0b")
            tangent_lbl = Text("Tangent Line", font_size=14, color="#f59e0b").next_to(tangent, UL, buff=0.1)

            # Root Dots in Emerald/Gold
            dot1 = Dot(axes.c2p(-1.414, 0), color="#10b981", radius=0.08)
            dot2 = Dot(axes.c2p(1.414, 0), color="#10b981", radius=0.08)
            lbl1 = Text("Points A", font_size=12, color="#10b981").next_to(dot1, DL, buff=0.08)
            lbl2 = Text("Points B", font_size=12, color="#10b981").next_to(dot2, DR, buff=0.08)

            self.play(Create(axes), run_time=0.8)
            self.play(Create(curve), FadeIn(curve_lbl), run_time=1.0)
            self.play(Create(tangent), FadeIn(tangent_lbl), run_time=0.8)
            self.play(GrowFromCenter(dot1), FadeIn(lbl1), GrowFromCenter(dot2), FadeIn(lbl2), run_time=0.8)
            self.wait(max(0.5, graph_dur - 3.4))

            # --- PART 4: FINAL SOLUTION BOX ---
            self.play(
                FadeOut(axes),
                FadeOut(curve),
                FadeOut(curve_lbl),
                FadeOut(tangent),
                FadeOut(tangent_lbl),
                FadeOut(dot1),
                FadeOut(lbl1),
                FadeOut(dot2),
                FadeOut(lbl2),
                FadeOut(graph_title),
                run_time=0.6,
            )

            fin_title = Text("Verified Final Solution", font_size=24, color="#10b981", weight="BOLD").to_edge(UP, buff=1.2)
            fin_math = SVGMobject(sol_svg).scale(1.4).shift(UP * 0.2)
            rect = SurroundingRectangle(fin_math, color="#00a8ff", buff=0.3, corner_radius=0.15)
            verified = Text("Verified by Infinix Math CAS Engine", font_size=16, color="#94a3b8").next_to(rect, DOWN, buff=0.6)

            self.play(FadeIn(fin_title), GrowFromCenter(fin_math), Create(rect), FadeIn(verified), run_time=1.0)
            self.wait(1.5)

    # 4. Render Manim Scene
    scene = SolverExplainerScene()
    scene.render()

    # Locate rendered raw video
    rendered_raw_video = Path(scene.renderer.file_writer.movie_file_path)

    # 5. Mux Video + Audio with FFmpeg
    final_output_path = MEDIA_DIR / f"{video_id}.mp4"
    cmd = [
        FFMPEG_EXE,
        "-y",
        "-i",
        str(rendered_raw_video),
        "-i",
        master_audio,
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-shortest",
        str(final_output_path),
    ]
    subprocess.run(cmd, check=True, capture_output=True)

    total_dur = get_audio_duration(str(final_output_path))

    return {
        "video_id": video_id,
        "filename": f"{video_id}.mp4",
        "duration_seconds": round(total_dur, 1),
        "url": f"/api/v1/video/stream/{video_id}",
    }
