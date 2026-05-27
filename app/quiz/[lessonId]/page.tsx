import { notFound } from "next/navigation";
import { compose } from "@/src/composition";
import { buildQuizItems } from "@application/buildQuizItems";
import { QuizSession } from "./QuizSession";

export default async function QuizPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const { store } = compose();
  const lessons = await store.listLessons();
  const lesson = lessons.find(l => l.id === lessonId);
  if (!lesson) notFound();
  const song = await store.getSong(lesson.songId);
  if (!song) notFound();
  const cards = await store.listCards();
  const spec = buildQuizItems(song, cards);
  return <QuizSession lessonId={lesson.id} spec={spec} />;
}
