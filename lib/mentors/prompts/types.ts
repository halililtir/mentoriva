/**
 * Prompt modülünün iç tip tanımları.
 */

export interface PromptExample {
  user: string;
  assistant: string;
}

export interface MentorPromptBundle {
  /** İlk soru için system prompt. */
  initial: string;
  /** Chat (devam eden sohbet) için system prompt. */
  chat: string;
  /** Few-shot örnekleri — Claude'un karakteri tutturması için. */
  examples: PromptExample[];
  /** Kaçınılacak cevaplar: neden yanlış olduklarıyla (karikatürleşmeyi ve tahmin üretmeyi önler). */
  avoid?: AvoidExample[];
}

export interface AvoidExample extends PromptExample {
  /** Bu cevap neden kötü (modele gösterilir). */
  why: string;
}
