import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Plus, ArrowRight } from "lucide-react";
import { Button } from "@stolink/ui";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import type { UIRelationType } from "./constants";
import { RelationshipTypeSelector } from "./RelationshipDeepAnalysis/components/RelationshipTypeSelector";
import { StrengthSlider } from "./RelationshipDeepAnalysis/components/StrengthSlider";
import type { Character } from "@/types";

interface CreateRelationshipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    sourceId: string;
    targetId: string;
    types: UIRelationType[];
    strength: number;
    bidirectional: boolean;
    description: string;
  }) => void;
  characters: Character[];
  isCreating?: boolean;
}

export function CreateRelationshipDialog({
  isOpen,
  onClose,
  onCreate,
  characters,
  isCreating = false,
}: CreateRelationshipDialogProps) {
  const [sourceId, setSourceId] = useState<string>("");
  const [targetId, setTargetId] = useState<string>("");
  const [types, setTypes] = useState<UIRelationType[]>([]);
  const [strength, setStrength] = useState(1);
  const [bidirectional, setBidirectional] = useState(true);
  const [description, setDescription] = useState("");

  const isValid =
    sourceId && targetId && sourceId !== targetId && types.length > 0;

  const handleCreate = useCallback(() => {
    if (!isValid) return;
    onCreate({
      sourceId,
      targetId,
      types,
      strength,
      bidirectional,
      description,
    });
  }, [
    sourceId,
    targetId,
    types,
    strength,
    bidirectional,
    description,
    isValid,
    onCreate,
  ]);

  // Reset form on close
  const handleClose = useCallback(() => {
    onClose();
    // Optional: Reset state here if desired, or keep it for user convenience
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <DialogPrimitive.Root open={isOpen} onOpenChange={handleClose}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-[160] bg-espresso-900/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild>
              <motion.div
                className="fixed left-1/2 top-1/2 z-[161] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 p-4"
                initial={{ opacity: 0, scale: 0.95, y: "-45%" }}
                animate={{ opacity: 1, scale: 1, y: "-50%" }}
                exit={{ opacity: 0, scale: 0.95, y: "-45%" }}
              >
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Header */}
                  <div className="px-8 py-6 border-b border-espresso-100 flex items-center justify-between shrink-0">
                    <div>
                      <h2 className="text-xl font-bold text-espresso-900 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-mocha-500" />
                        새로운 관계 형성
                      </h2>
                      <p className="text-sm text-espresso-500 mt-1">
                        두 캐릭터 간의 새로운 서사를 시작합니다
                      </p>
                    </div>
                    <Button
                      intent="ghost"
                      size="icon"
                      onClick={handleClose}
                      className="rounded-full hover:bg-espresso-50"
                    >
                      <X className="w-5 h-5 text-espresso-400" />
                    </Button>
                  </div>

                  {/* Body - Scrollable */}
                  <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    {/* 1. Character Selection */}
                    <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-espresso-500 uppercase tracking-wider">
                          From (주체)
                        </label>
                        <select
                          value={sourceId}
                          onChange={(e) => setSourceId(e.target.value)}
                          className="w-full h-12 rounded-xl border border-cloud-200 bg-cloud-50 px-3 text-sm font-medium focus:border-mocha-400 focus:ring-0 transition-colors"
                          disabled={isCreating}
                        >
                          <option value="">캐릭터 선택</option>
                          {characters.map((char) => (
                            <option
                              key={char._id}
                              value={char._id}
                              disabled={char._id === targetId}
                            >
                              {char.profile?.name || "이름 없음"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-6">
                        <div className="w-8 h-8 rounded-full bg-mocha-50 flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-mocha-400" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-espresso-500 uppercase tracking-wider">
                          To (대상)
                        </label>
                        <select
                          value={targetId}
                          onChange={(e) => setTargetId(e.target.value)}
                          className="w-full h-12 rounded-xl border border-cloud-200 bg-cloud-50 px-3 text-sm font-medium focus:border-mocha-400 focus:ring-0 transition-colors"
                          disabled={isCreating}
                        >
                          <option value="">캐릭터 선택</option>
                          {characters.map((char) => (
                            <option
                              key={char._id}
                              value={char._id}
                              disabled={char._id === sourceId}
                            >
                              {char.profile?.name || "이름 없음"}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 2. Relationship Type */}
                    <RelationshipTypeSelector
                      selectedTypes={types}
                      onChange={setTypes}
                      disabled={isCreating}
                    />

                    {/* 3. Strength */}
                    <StrengthSlider
                      value={strength}
                      onChange={setStrength}
                      disabled={isCreating}
                    />

                    {/* 4. Options */}
                    <div className="flex items-center justify-between p-4 bg-cloud-50 rounded-2xl">
                      <div>
                        <label className="text-sm font-bold text-espresso-700">
                          양방향 관계
                        </label>
                        <p className="text-xs text-espresso-400 mt-0.5">
                          상대방도 동일한 관계를 가집니다
                        </p>
                      </div>
                      <Switch
                        checked={bidirectional}
                        onChange={setBidirectional}
                        disabled={isCreating}
                      />
                    </div>

                    {/* 5. Description */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-espresso-700">
                        설명
                      </label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="관계에 대한 메모를 남겨주세요..."
                        className="min-h-[100px] resize-none bg-cloud-50 border-cloud-200 focus:border-mocha-400 rounded-xl"
                        disabled={isCreating}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-espresso-100 flex justify-end gap-3 bg-white/50 shrink-0">
                    <Button
                      intent="ghost"
                      onClick={handleClose}
                      disabled={isCreating}
                    >
                      취소
                    </Button>
                    <Button
                      intent="primary"
                      onClick={handleCreate}
                      disabled={!isValid || isCreating}
                      isLoading={isCreating}
                      className="bg-mocha-500 hover:bg-mocha-600 px-8"
                    >
                      관계 생성
                    </Button>
                  </div>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </AnimatePresence>
  );
}
