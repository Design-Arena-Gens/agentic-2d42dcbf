"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./TodoApp.module.css";

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "agentic-todo-items";

const filterLabels: Record<Filter, string> = {
  all: "All",
  active: "Active",
  completed: "Completed"
};

export default function TodoApp() {
  const [items, setItems] = useState<Todo[]>([]);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Todo[];
      if (Array.isArray(parsed)) {
        setItems(parsed);
      }
    } catch (error) {
      console.error("Failed to parse stored todos", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addTodo = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const title = draft.trim();
      if (!title) return;

      const todo: Todo = {
        id: crypto.randomUUID(),
        title,
        completed: false,
        createdAt: Date.now()
      };
      setItems((current) => [todo, ...current]);
      setDraft("");
    },
    [draft]
  );

  const toggleCompleted = useCallback((id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  const removeTodo = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setItems((current) => current.filter((item) => !item.completed));
  }, []);

  const startEditing = useCallback((todo: Todo) => {
    setEditingId(todo.id);
    setEditDraft(todo.title);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditDraft("");
  }, []);

  const saveEdit = useCallback(() => {
    const next = editDraft.trim();
    if (!editingId || !next) {
      cancelEditing();
      return;
    }
    setItems((current) =>
      current.map((item) =>
        item.id === editingId ? { ...item, title: next } : item
      )
    );
    cancelEditing();
  }, [cancelEditing, editDraft, editingId]);

  const remainingCount = useMemo(
    () => items.filter((item) => !item.completed).length,
    [items]
  );

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (filter === "active") return !item.completed;
        if (filter === "completed") return item.completed;
        return true;
      })
      .filter((item) =>
        item.title.toLowerCase().includes(search.trim().toLowerCase())
      );
  }, [filter, items, search]);

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tasks</h1>
        <p className={styles.subtitle}>Simple todo list with filters & persistence</p>
      </header>

      <form className={styles.form} onSubmit={addTodo}>
        <input
          aria-label="Add a new task"
          className={styles.input}
          placeholder="Add a new task"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          autoFocus
        />
        <button className={styles.primaryButton} type="submit">
          Add
        </button>
      </form>

      <div className={styles.toolbar}>
        <div className={styles.filters} role="radiogroup" aria-label="Filter tasks">
          {(Object.keys(filterLabels) as Filter[]).map((key) => {
            const isActive = filter === key;
            return (
              <button
                key={key}
                className={isActive ? styles.activeFilter : styles.filterButton}
                onClick={() => setFilter(key)}
                type="button"
                aria-pressed={isActive}
              >
                {filterLabels[key]}
              </button>
            );
          })}
        </div>

        <input
          className={styles.search}
          placeholder="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search tasks"
        />
      </div>

      <ul className={styles.list}>
        {filteredItems.length === 0 ? (
          <li className={styles.emptyState}>No tasks to show</li>
        ) : (
          filteredItems.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <li key={item.id} className={styles.listItem}>
                <label className={styles.todoContent}>
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleCompleted(item.id)}
                    aria-label={`Mark ${item.title} as ${item.completed ? "incomplete" : "complete"}`}
                  />
                  {isEditing ? (
                    <input
                      className={styles.editInput}
                      value={editDraft}
                      onChange={(event) => setEditDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          saveEdit();
                        }
                        if (event.key === "Escape") {
                          cancelEditing();
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className={item.completed ? styles.completed : undefined}>
                      {item.title}
                    </span>
                  )}
                </label>

                <div className={styles.actions}>
                  {isEditing ? (
                    <>
                      <button className={styles.secondaryButton} onClick={saveEdit} type="button">
                        Save
                      </button>
                      <button className={styles.secondaryButton} onClick={cancelEditing} type="button">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => startEditing(item)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className={styles.dangerButton}
                        onClick={() => removeTodo(item.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>

      <footer className={styles.footer}>
        <span>
          {remainingCount} {remainingCount === 1 ? "task" : "tasks"} remaining
        </span>
        <button className={styles.clearButton} onClick={clearCompleted} type="button">
          Clear completed
        </button>
      </footer>
    </section>
  );
}
