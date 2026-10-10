/**
 * Hafıza (onaylı notlar) — yalnızca kendi notların.
 *   GET                         → { memory }
 *   POST   { text, source? }    → { memory }   (en fazla 20 not)
 *   PATCH  { id, text } | { enabled } → { memory }
 *   DELETE ?id=  | ?all=1       → { memory } | { success }
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { jsonError, readJson } from '@/lib/http';
import { recordEvent } from '@/lib/admin/metrics';
import { MAX_NOTES, addNote, clearMemory, deleteNote, editNote, getMemory, setMemoryEnabled, type NoteSource } from '@/lib/memory/notes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SOURCES: NoteSource[] = ['self', 'chat', 'card'];
const isId = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{12}$/.test(v);

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  return NextResponse.json({ memory: await getMemory(user.username) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  const body = await readJson(req);
  const source = SOURCES.includes(body?.['source'] as NoteSource) ? (body?.['source'] as NoteSource) : 'self';
  const result = await addNote(user.username, typeof body?.['text'] === 'string' ? body['text'] : '', source);
  if (result === 'empty') return jsonError(400, 'Not boş olamaz');
  if (result === 'full') return jsonError(400, `En fazla ${MAX_NOTES} not tutabilirsin; önce birini sil.`);
  await recordEvent('memory_note');
  return NextResponse.json({ memory: result });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  const body = await readJson(req);
  if (typeof body?.['enabled'] === 'boolean') {
    return NextResponse.json({ memory: await setMemoryEnabled(user.username, body['enabled']) });
  }
  if (!isId(body?.['id'])) return jsonError(400, 'Geçersiz not');
  const memory = await editNote(user.username, body['id'], typeof body['text'] === 'string' ? body['text'] : '');
  return memory ? NextResponse.json({ memory }) : jsonError(404, 'Not bulunamadı');
}

export async function DELETE(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  const params = new URL(req.url).searchParams;
  if (params.get('all') === '1') {
    await clearMemory(user.username);
    return NextResponse.json({ success: true });
  }
  const id = params.get('id');
  if (!isId(id)) return jsonError(400, 'Geçersiz not');
  const memory = await deleteNote(user.username, id);
  return memory ? NextResponse.json({ memory }) : jsonError(404, 'Not bulunamadı');
}
