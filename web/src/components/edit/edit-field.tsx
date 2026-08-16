"use client";

import type { EditableField } from "@/lib/edit/fields";

import styles from "./edit-mode.module.css";

/**
 * Jedno pole v panelu. Delší texty dostanou textareu, která zhruba odpovídá
 * délce obsahu - ať klient nemusí scrollovat uvnitř malého okénka.
 *
 * `data-field` slouží panelu k doskočení na pole, které je zrovna vidět v rámu.
 */

type EditFieldProps = {
  readonly field: EditableField;
  readonly value: string;
  readonly changed: boolean;
  /** Text, u kterého se čtenář v rámu právě nachází. */
  readonly active: boolean;
  readonly onChange: (field: EditableField, value: string) => void;
  readonly onFocus: (field: EditableField) => void;
  readonly onBlur: () => void;
};

const rowsFor = (value: string): number =>
  Math.min(12, Math.max(3, Math.ceil(value.length / 48)));

export function EditField({
  field,
  value,
  changed,
  active,
  onChange,
  onFocus,
  onBlur,
}: EditFieldProps) {
  const shared = {
    id: field.key,
    value,
    className: `${field.type === "block" ? styles.textarea : styles.input} ${
      changed ? styles.changed : ""
    }`,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange(field, event.target.value),
    onFocus: () => onFocus(field),
    onBlur,
  };

  return (
    <div
      className={`${styles.field} ${active ? styles.fieldActive : ""}`}
      data-field={field.key}
    >
      <label className={styles.fieldLabel} htmlFor={field.key}>
        {field.label}
      </label>
      {field.hint ? <p className={styles.fieldHint}>{field.hint}</p> : null}
      {field.type === "block" ? (
        <textarea {...shared} rows={rowsFor(value)} />
      ) : (
        <input {...shared} type="text" />
      )}
    </div>
  );
}
