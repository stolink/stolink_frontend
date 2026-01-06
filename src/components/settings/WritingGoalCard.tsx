import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@stolink/ui";
import { Input } from "@stolink/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@stolink/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// TODO: Replace with real data from backend
const MOCK_GOAL = {
  dailyTarget: 5000,
  dailyCurrent: 3240,
  weeklyTarget: 25000,
  weeklyCurrent: 12500,
};

export function WritingGoalCard() {
  const [goalType, setGoalType] = useState("daily");
  const [target, setTarget] = useState(MOCK_GOAL.dailyTarget.toString());
  const [isEditing, setIsEditing] = useState(false);

  const progress =
    goalType === "daily"
      ? (MOCK_GOAL.dailyCurrent / MOCK_GOAL.dailyTarget) * 100
      : (MOCK_GOAL.weeklyCurrent / MOCK_GOAL.weeklyTarget) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="transition-all duration-300 hover:shadow-paper border-mocha-100 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2  text-xl text-espresso-900">
            <Target className="h-5 w-5 text-mocha-500" />
            집필 목표
          </CardTitle>
          <CardDescription className="text-muted-foreground ">
            목표를 설정하고 꾸준한 집필 습관을 만드세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={goalType} onValueChange={setGoalType} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-cloud-100/50">
              <TabsTrigger
                value="daily"
                className="data-[state=active]:bg-white data-[state=active]:text-mocha-700 data-[state=active]:shadow-sm"
              >
                일일 목표
              </TabsTrigger>
              <TabsTrigger
                value="weekly"
                className="data-[state=active]:bg-white data-[state=active]:text-mocha-700 data-[state=active]:shadow-sm"
              >
                주간 목표
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">
                  오늘의 진행률
                </span>
                <span className="font-bold text-mocha-700 text-lg ">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress
                value={progress}
                className="h-2.5 bg-mocha-100 [&>div]:bg-mocha-500"
              />
              <div className="flex justify-between text-sm pt-1">
                <span className=" text-espresso-900">
                  {MOCK_GOAL.dailyCurrent.toLocaleString()}자
                </span>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="h-8 w-24 text-right border-mocha-200 focus-visible:ring-mocha-400"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        intent="ghost"
                        className="h-8 px-2 hover:bg-mocha-50 text-mocha-600"
                      >
                        저장
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="cursor-pointer hover:underline text-muted-foreground hover:text-mocha-600 transition-colors "
                      onClick={() => setIsEditing(true)}
                    >
                      / {Number(target).toLocaleString()}자
                    </span>
                  )}
                </div>
              </div>

              {progress >= 100 && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-success/10 text-success p-3 rounded-md flex items-center gap-2 text-sm border border-success/20"
                >
                  <Trophy className="h-4 w-4" />
                  축하합니다! 오늘의 목표를 달성했습니다.
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">
                  이번 주 진행률
                </span>
                <span className="font-bold text-mocha-700 text-lg ">
                  {Math.round(
                    (MOCK_GOAL.weeklyCurrent / MOCK_GOAL.weeklyTarget) * 100,
                  )}
                  %
                </span>
              </div>
              <Progress
                value={(MOCK_GOAL.weeklyCurrent / MOCK_GOAL.weeklyTarget) * 100}
                className="h-2.5 bg-mocha-100 [&>div]:bg-mocha-500"
              />
              <div className="flex justify-between text-sm pt-1">
                <span className=" text-espresso-900">
                  {MOCK_GOAL.weeklyCurrent.toLocaleString()}자
                </span>
                <span className="text-muted-foreground ">
                  / {MOCK_GOAL.weeklyTarget.toLocaleString()}자
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-mocha-600 bg-mocha-50/50 p-3 rounded-md border border-mocha-100">
                <TrendingUp className="h-4 w-4" />
                지난 주보다 15% 더 많이 썼어요!
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
