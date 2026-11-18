import { useState } from "react";
import styles from "./App.module.scss";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Система оренди нерухомості</h1>
        <p className={styles.muted}>Перевірка стилів і теми</p>
        <button className={styles.button} onClick={toggleTheme}>
          Тема: {theme === "light" ? "світла" : "темна"}
        </button>
      </div>
    </div>
  );
}

export default App;