"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Trash2,
  Pencil,
  Globe,
  CircleHelp,
  Plus,
  FileText,
  MessageSquarePlus,
  ShieldCheck,
} from "lucide-react";
import {
  Button,
  Card,
  Badge,
  Input,
  Textarea,
  Label,
  Spinner,
} from "@/components/ui";
import {
  addFaqAction,
  addDocumentAction,
  scanWebsiteAction,
  setKnowledgeStatusAction,
  deleteKnowledgeAction,
  updateKnowledgeAction,
} from "@/actions/knowledge";
import { cn } from "@/lib/utils";

export interface SourceItem {
  id: string;
  type: "website" | "faq" | "document" | "manual";
  title: string;
  content: string;
  sourceUrl: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

export interface UnansweredItem {
  messageId: string;
  question: string;
  createdAt: Date;
}

const TYPE_LABEL: Record<SourceItem["type"], string> = {
  website: "Website import",
  faq: "FAQ",
  document: "Document",
  manual: "Manual",
};

export function KnowledgeManager({
  propertyId,
  websiteUrl,
  sources,
  unanswered,
}: {
  propertyId: string;
  websiteUrl: string | null;
  sources: SourceItem[];
  unanswered: UnansweredItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  // Add FAQ form
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  // Add document form
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  // Scan form
  const [scanUrl, setScanUrl] = useState(websiteUrl ?? "");
  // Edit state
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const flash = (ok: boolean, text: string) => setNotice({ ok, text });

  const run = (
    fn: () => Promise<{ ok: boolean; error?: string }>,
    okText: string,
  ) => {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        flash(true, okText);
        router.refresh();
      } else {
        flash(false, result.error ?? "Something went wrong.");
      }
    });
  };

  const addFaq = () => {
    if (question.trim().length < 1 || answer.trim().length < 4) {
      flash(
        false,
        "Question is required and the answer must be at least 4 characters.",
      );
      return;
    }
    run(
      async () => addFaqAction({ propertyId, question, answer }),
      "FAQ added and approved.",
    );
    setQuestion("");
    setAnswer("");
  };

  const addDoc = () => {
    run(
      async () =>
        addDocumentAction({ propertyId, title: docTitle, content: docContent }),
      "Document added and approved.",
    );
    setDocTitle("");
    setDocContent("");
  };

  const scan = () => {
    run(
      async () => scanWebsiteAction({ propertyId, url: scanUrl }),
      "Scan complete — review the pending import below and approve it to make it trusted knowledge.",
    );
  };

  const startEdit = (s: SourceItem) => {
    setEditing(s.id);
    setEditTitle(s.title);
    setEditContent(s.content);
  };

  const saveEdit = (id: string) => {
    run(
      async () =>
        updateKnowledgeAction({ id, title: editTitle, content: editContent }),
      "Entry updated.",
    );
    setEditing(null);
  };

  const pendingSources = sources.filter((s) => s.status === "pending");
  const approvedSources = sources.filter((s) => s.status === "approved");
  const rejectedSources = sources.filter((s) => s.status === "rejected");

  return (
    <div className="space-y-8">
      {notice && (
        <div
          role="status"
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            notice.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {notice.text}
        </div>
      )}

      {/* Unanswered questions loop */}
      {unanswered.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60 p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <CircleHelp className="size-5 text-amber-600" />
            Unanswered guest questions ({unanswered.length})
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Your assistant couldn&apos;t confirm these. Add an approved FAQ to
            teach it — this is how the assistant gets smarter.
          </p>
          <ul className="mt-4 space-y-2.5">
            {unanswered.map((u) => (
              <li
                key={u.messageId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-100 bg-white px-4 py-3"
              >
                <span className="text-sm text-ink-700">“{u.question}”</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    setQuestion(u.question);
                    setAnswer("");
                    document
                      .getElementById("add-faq-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <Plus className="size-3.5" />
                  Turn into FAQ
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Add FAQ */}
        <Card className="p-6" id="add-faq-section">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <MessageSquarePlus className="size-5 text-brand-600" />
            Add FAQ
          </h2>
          <p className="mt-1 text-xs text-ink-400">
            Owner-authored FAQs are trusted immediately.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="faq-q">Question</Label>
              <Input
                id="faq-q"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What time is check-out?"
                maxLength={300}
              />
            </div>
            <div>
              <Label htmlFor="faq-a">Answer</Label>
              <Textarea
                id="faq-a"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Check-out is until 11:00 AM…"
                rows={4}
                maxLength={4000}
              />
            </div>
            <Button onClick={addFaq} disabled={pending} className="w-full">
              {pending ? <Spinner /> : <Plus className="size-4" />}
              Add approved FAQ
            </Button>
          </div>
        </Card>

        {/* Scan website */}
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <Globe className="size-5 text-brand-600" />
            Import from website
          </h2>
          <p className="mt-1 text-xs text-ink-400">
            Respects robots.txt & rate limits. Results stay pending until you
            approve them.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="scan-url">Page URL</Label>
              <Input
                id="scan-url"
                type="url"
                value={scanUrl}
                onChange={(e) => setScanUrl(e.target.value)}
                placeholder="https://yourhotel.com/rooms"
              />
            </div>
            <Button
              onClick={scan}
              disabled={pending || scanUrl.trim().length < 8}
              className="w-full"
              variant="secondary"
            >
              {pending ? <Spinner /> : <Globe className="size-4" />}
              Scan page safely
            </Button>
            <p className="text-xs leading-relaxed text-ink-400">
              If the scan fails (site blocks bots, JavaScript-heavy page), add
              the same content with an FAQ or document instead.
            </p>
          </div>
        </Card>

        {/* Add document */}
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <FileText className="size-5 text-brand-600" />
            Add document
          </h2>
          <p className="mt-1 text-xs text-ink-400">
            Paste policies, house rules, menus, or guides (up to 20k
            characters).
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="doc-t">Title</Label>
              <Input
                id="doc-t"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Spa & pool guide"
              />
            </div>
            <div>
              <Label htmlFor="doc-c">Content</Label>
              <Textarea
                id="doc-c"
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                rows={3}
                placeholder="Paste plain text here…"
              />
            </div>
            <Button
              onClick={addDoc}
              disabled={
                pending ||
                docTitle.trim().length < 2 ||
                docContent.trim().length < 20
              }
              className="w-full"
              variant="secondary"
            >
              {pending ? <Spinner /> : <Plus className="size-4" />}
              Add approved document
            </Button>
          </div>
        </Card>
      </div>

      {/* Source list */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <ShieldCheck className="size-5 text-emerald-600" />
          <p className="text-sm text-ink-500">
            <span className="font-semibold text-ink-800">
              {approvedSources.length} approved
            </span>
            {" · "}
            <span className="font-semibold text-amber-700">
              {pendingSources.length} awaiting review
            </span>
            {" · "}
            <span>{rejectedSources.length} rejected</span>
          </p>
        </div>

        {sources.length === 0 ? (
          <Card className="px-6 py-14 text-center">
            <p className="text-sm text-ink-500">
              No knowledge yet. Add FAQs, documents, or scan your website above
              — the assistant will only answer from approved entries.
            </p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {sources.map((s) => (
              <li key={s.id}>
                <Card
                  className={cn(
                    "p-5",
                    s.status === "pending" && "border-amber-200 bg-amber-50/40",
                    s.status === "rejected" && "opacity-70",
                  )}
                >
                  {editing === s.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={6}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(s.id)}
                          disabled={pending}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditing(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">{TYPE_LABEL[s.type]}</Badge>
                        {s.status === "approved" && (
                          <Badge tone="green">Approved</Badge>
                        )}
                        {s.status === "pending" && (
                          <Badge tone="amber">Pending review</Badge>
                        )}
                        {s.status === "rejected" && (
                          <Badge tone="red">Rejected</Badge>
                        )}
                        {s.sourceUrl && (
                          <a
                            href={s.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-xs text-ink-400 hover:text-brand-700"
                          >
                            {s.sourceUrl}
                          </a>
                        )}
                      </div>
                      <h3 className="mt-2 font-semibold text-ink-900">
                        {s.title}
                      </h3>
                      <p className="mt-1 line-clamp-3 text-sm whitespace-pre-wrap text-ink-500">
                        {s.content}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {s.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() =>
                              run(
                                async () =>
                                  setKnowledgeStatusAction({
                                    id: s.id,
                                    status: "approved",
                                  }),
                                "Approved — now trusted knowledge.",
                              )
                            }
                          >
                            <Check className="size-3.5 text-emerald-600" />
                            Approve
                          </Button>
                        )}
                        {s.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() =>
                              run(
                                async () =>
                                  setKnowledgeStatusAction({
                                    id: s.id,
                                    status: "rejected",
                                  }),
                                "Rejected — no longer used by the assistant.",
                              )
                            }
                          >
                            <X className="size-3.5" />
                            Reject
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(s)}
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => {
                            if (
                              window.confirm("Delete this entry permanently?")
                            ) {
                              run(
                                async () => deleteKnowledgeAction(s.id),
                                "Deleted.",
                              );
                            }
                          }}
                        >
                          <Trash2 className="size-3.5 text-red-500" />
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
