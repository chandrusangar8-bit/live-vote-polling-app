import React, { useState } from 'react';
import { X, Plus, Trash2, Sparkles, HelpCircle } from 'lucide-react';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    question: string;
    description?: string;
    category: string;
    options: { text: string; color: string }[];
    allowMultiple: boolean;
    expiresAt?: string | null;
  }) => Promise<void>;
}

const COLOR_PALETTE = [
  '#38bdf8', // sky/cyan
  '#818cf8', // indigo
  '#34d399', // emerald
  '#f472b6', // pink
  '#fbbf24', // amber
  '#a78bfa', // purple
  '#f87171', // rose
  '#2dd4bf'  // teal
];

const CATEGORIES = [
  'Technology',
  'Engineering',
  'Product Strategy',
  'Workplace',
  'Design & UX',
  'Community',
  'General'
];

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [expirationChoice, setExpirationChoice] = useState<'never' | '1h' | '24h' | '7d'>('never');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [options, setOptions] = useState([
    { text: '', color: COLOR_PALETTE[0] },
    { text: '', color: COLOR_PALETTE[1] },
    { text: '', color: COLOR_PALETTE[2] }
  ]);

  if (!isOpen) return null;

  const handleOptionChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index].text = text;
    setOptions(updated);
  };

  const handleColorChange = (index: number, color: string) => {
    const updated = [...options];
    updated[index].color = color;
    setOptions(updated);
  };

  const addOption = () => {
    if (options.length >= 8) return;
    const nextColor = COLOR_PALETTE[options.length % COLOR_PALETTE.length];
    setOptions([...options, { text: '', color: nextColor }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (question.trim().length < 4) {
      setError('Please provide a descriptive question of at least 4 characters');
      return;
    }

    const filledOptions = options.map((o) => ({ ...o, text: o.text.trim() }));
    if (filledOptions.some((o) => !o.text)) {
      setError('All option labels must be filled out');
      return;
    }

    let expiresAt: string | null = null;
    if (expirationChoice === '1h') expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    if (expirationChoice === '24h') expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    if (expirationChoice === '7d') expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    try {
      setIsSubmitting(true);
      await onSubmit({
        question: question.trim(),
        description: description.trim() || undefined,
        category,
        options: filledOptions,
        allowMultiple,
        expiresAt
      });
      // Reset form
      setQuestion('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl p-6 sm:p-8 my-8">
        <div className="flex items-center justify-between pb-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create New Live Poll</h3>
              <p className="text-xs text-slate-400">
                Setup real-time questions with atomic counting and WebSocket broadcast.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Question */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Poll Question *
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which cloud architecture pattern should we prioritize for 2026?"
              required
              maxLength={200}
              className="w-full px-4 py-2.5 text-sm text-white glass-input rounded-xl focus:border-cyan-400 transition-all placeholder:text-slate-500"
            />
            <div className="flex justify-end text-[10px] text-slate-500 mt-1">
              {question.length}/200
            </div>
          </div>

          {/* Description & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs text-white glass-input rounded-xl focus:border-cyan-400 transition-all bg-slate-900"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Optional Context / Subtitle
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief context for voters..."
                maxLength={120}
                className="w-full px-4 py-2.5 text-xs text-white glass-input rounded-xl focus:border-cyan-400 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Multiple Choice Answers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Multiple Choice Options (2-8)
              </label>
              <span className="text-[11px] text-slate-500">
                Click color dot to customize bar hue
              </span>
            </div>

            <div className="space-y-2.5">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {/* Color Picker Dropdown / Dot */}
                  <div className="relative group shrink-0">
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg border border-white/20 transition-transform group-hover:scale-110 flex items-center justify-center cursor-pointer"
                      style={{ backgroundColor: opt.color }}
                      title="Change color"
                    />
                    <div className="hidden group-hover:flex absolute left-0 top-8 z-30 p-2 rounded-xl bg-slate-950 border border-white/10 shadow-xl gap-1.5">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleColorChange(idx, c)}
                          className="w-5 h-5 rounded-full border border-white/20 hover:scale-125 transition-transform cursor-pointer"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    required
                    className="flex-1 px-4 py-2 text-xs text-white glass-input rounded-xl focus:border-cyan-400 transition-all placeholder:text-slate-500"
                  />

                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="p-2 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 8 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add another option</span>
              </button>
            )}
          </div>

          {/* Voting Configuration & Settings */}
          <div className="pt-2 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={allowMultiple}
                onChange={(e) => setAllowMultiple(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 border-white/20 bg-slate-900"
              />
              <span className="text-xs text-slate-300">
                Allow multiple choices per voter
              </span>
            </label>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Auto-Close Expiration
              </label>
              <select
                value={expirationChoice}
                onChange={(e) => setExpirationChoice(e.target.value as any)}
                className="w-full px-3 py-2 text-xs text-white glass-input rounded-xl bg-slate-900"
              >
                <option value="never">No Expiration (Keep Active)</option>
                <option value="1h">Close in 1 Hour</option>
                <option value="24h">Close in 24 Hours</option>
                <option value="7d">Close in 7 Days</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Publishing...' : 'Publish Live Poll'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
