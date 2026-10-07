"use client";
import { FileText, ArrowRight, FolderOpen, Cpu, BookOpen } from "lucide-react";
import Stepper from "@/components/react-bits/Stepper";
import StoryDocument from "./StoryDocument";
export default function WorkflowDemo() {
  return <div className="rm-workflow-demo"><Stepper steps={[
    { title: "PDF를 고릅니다", description: "다시 읽거나 활용하고 싶은 자료를 준비하세요. 이번 예시는 앞에서 살펴본 ‘기록을 넘어, 다음 생각으로’ 문서입니다.", content: <div className="rm-workflow-document"><StoryDocument compact /></div> },
    { title: "내용을 읽고 정리합니다", description: "내 컴퓨터의 모델이 PDF 속 글자를 읽고 제목과 문단을 정리합니다. 관련 그림은 본문과 연결합니다.", content: <div className="rm-processing"><span><FileText size={34} /><strong>PDF</strong></span><ArrowRight size={22} /><span><Cpu size={34} /><strong>ReadyMD</strong></span><div><p>글자를 읽고</p><p>문단을 정리하고</p><p>그림을 연결합니다</p></div></div> },
    { title: "열어 보고 활용합니다", description: "변환한 내용을 원문과 비교한 뒤, 전자책으로 읽거나 본문과 이미지를 다음 작업에 활용하세요.", content: <div className="rm-output-files"><p><BookOpen size={22} /><span><strong>읽기 편한 전자책</strong><small>reading-note.epub</small></span></p><p><FileText size={22} /><span><strong>다시 활용할 본문</strong><small>reading-note.md</small></span></p><p><FolderOpen size={22} /><span><strong>본문과 연결된 그림</strong><small>images / reading-map.svg</small></span></p><a className="gr-text-link" href="#experience">예시 다시 살펴보기 <ArrowRight size={16} /></a></div> },
  ]} /></div>;
}
