import {
  Clapperboard,
  Youtube,
  Sparkles,
  Wand2,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useParams, Link } from "react-router-dom";

export default function StudioPage() {
  const location = useLocation();
  const { id: projectId } = useParams<{ id: string }>();
  const selectedText = location.state?.selectedText as string | undefined;

  return (
    <div className="h-full flex flex-col bg-stone-50/30 overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-stone-100 bg-white">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <h1 className="text-2xl font-heading font-bold text-stone-900 flex items-center gap-2">
              <Clapperboard className="w-6 h-6 text-indigo-600" />
              Promotion Studio
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              소설의 핵심 장면을 강렬한 숏폼 영상으로 만들어 독자를
              사로잡으세요.
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Youtube className="w-4 h-4 text-red-600" />
            채널 연동하기
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Scene Selection & Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Scene Selection */}
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      1. 하이라이트 장면 선택
                    </CardTitle>
                    <CardDescription>
                      영상화할 이야기의 클라이맥스나 명장면을 선택하세요.
                    </CardDescription>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-indigo-50 text-indigo-700"
                  >
                    Step 1
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Imported Text from Editor */}
                  {selectedText ? (
                    <div className="p-4 rounded-lg border-2 border-indigo-500 bg-indigo-50/50 cursor-pointer shadow-sm ring-1 ring-indigo-200">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          에디터에서 가져옴
                        </span>
                        <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px]">
                          Selected
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-stone-800 leading-snug line-clamp-4">
                        {selectedText}
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 rounded-lg border border-dashed border-stone-300 bg-stone-50/50 flex flex-col items-center justify-center text-center gap-3 min-h-[150px] col-span-full">
                      <FileText className="w-8 h-8 text-stone-300" />
                      <div>
                        <p className="text-sm font-medium text-stone-500">
                          선택된 텍스트가 없습니다
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                          에디터에서 텍스트를 선택하고
                          <br />
                          'Studio로 보내기'를 클릭하세요.
                        </p>
                      </div>
                      <Link to={`/projects/${projectId}/editor`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          에디터로 돌아가기
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Mock Scene Cards */}
                  {[
                    {
                      id: 1,
                      title: "3장: 배신의 밤",
                      summary: "주인공이 믿었던 동료에게 칼을 맞는 장면",
                      type: "Betrayal",
                    },
                    {
                      id: 2,
                      title: "7장: 최후의 결전",
                      summary: "마왕성 앞에서의 마지막 연설",
                      type: "Epic",
                    },
                  ].map((scene) => (
                    <div
                      key={scene.id}
                      className="p-4 rounded-lg border border-stone-200 bg-white hover:border-indigo-300 hover:ring-1 hover:ring-indigo-300 cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-stone-500">
                          {scene.title}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {scene.type}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-stone-800 leading-snug group-hover:text-indigo-700">
                        {scene.summary}
                      </p>
                    </div>
                  ))}
                  <div className="p-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center text-stone-400 gap-2 hover:bg-stone-100 cursor-pointer transition-colors min-h-[100px]">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      AI 자동 추천 받기
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Style & Format */}
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      2. 스타일 및 포맷 설정
                    </CardTitle>
                    <CardDescription>
                      유튜브 숏츠(9:16)에 최적화된 스타일을 골라보세요.
                    </CardDescription>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-indigo-50 text-indigo-700"
                  >
                    Step 2
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-3 block">
                    영상 분위기 (Vibe)
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      "느와르/배신",
                      "웅장/판타지",
                      "감동/드라마",
                      "공포/스릴러",
                    ].map((style, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="rounded-full hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-3 block">
                    플랫폼 최적화
                  </label>
                  <Tabs defaultValue="shorts" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-stone-100">
                      <TabsTrigger value="shorts">
                        YouTube Shorts (9:16)
                      </TabsTrigger>
                      <TabsTrigger value="instagram">
                        Instagram Reel (9:16)
                      </TabsTrigger>
                      <TabsTrigger value="tiktok">TikTok (9:16)</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardContent>
              <CardFooter className="bg-stone-50/50 border-t border-stone-100 flex justify-end p-4">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md w-full sm:w-auto">
                  <Wand2 className="w-4 h-4 mr-2" />
                  홍보 영상 생성하기 (3 Credit)
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column: Preview & Tips */}
          <div className="space-y-6">
            {/* Preview Placeholder */}
            <div className="aspect-[9/16] bg-stone-900 rounded-2xl border-4 border-stone-800 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-500">
                <Youtube className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-sm font-medium text-stone-400 px-8 text-center">
                  장면을 선택하고 생성 버튼을 누르면
                  <br />
                  미리보기가 여기에 재생됩니다.
                </p>
              </div>

              {/* Overlay Mockup */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-50">
                <div className="h-2 w-2/3 bg-stone-600/50 rounded mb-2" />
                <div className="h-2 w-1/2 bg-stone-600/50 rounded" />
              </div>
            </div>

            {/* Quick Tips */}
            <Card className="bg-amber-50/50 border-amber-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-amber-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Pro Tip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-amber-700 leading-relaxed">
                  독자들은 "결말"보다는 "궁금증"을 유발하는 장면을 좋아합니다.{" "}
                  <br />
                  <strong>'배신의 순간'</strong>이나{" "}
                  <strong>'절체절명의 위기'</strong> 장면을 선택하여 "다음
                  내용이 궁금하다면?" 문구와 함께 링크를 남겨보세요.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
