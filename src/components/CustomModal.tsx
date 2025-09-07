"use client";
import React from "react";

interface CustomModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CustomModal({
  open,
  title,
  message,
  confirmText = "OK",
  cancelText = "キャンセル",
  onConfirm,
  onCancel,
}: CustomModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded shadow-lg w-[min(92vw,36rem)] p-6 space-y-4">
        <h2 className="text-lg font-bold">{title}</h2>
        {/* ← 改行反映 */}
        <p className="text-sm opacity-80 whitespace-pre-line">{message}</p>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-3 border rounded hover:bg-gray-100"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-3 rounded bg-black text-white hover:opacity-90"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
