import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

export const Route = createFileRoute("/calculadora")({
  head: () => ({
    meta: [
      { title: "Calculadora — Estilo Windows" },
      {
        name: "description",
        content: "Calculadora moderna estilo Windows feita com JavaScript e CSS moderno.",
      },
      { property: "og:title", content: "Calculadora — Estilo Windows" },
      {
        property: "og:description",
        content: "Calculadora moderna estilo Windows feita com JavaScript e CSS moderno.",
      },
    ],
  }),
  component: Calculadora,
});

type Op = "+" | "−" | "×" | "÷";

const OPS: Record<Op, (a: number, b: number) => number> = {
  "+": (a, b) => a + b,
  "−": (a, b) => a - b,
  "×": (a, b) => a * b,
  "÷": (a, b) => a / b,
};

function format(value: number): string {
  if (!Number.isFinite(value)) return "Não é possível dividir por zero";
  const rounded = Math.round((value + Number.EPSILON) * 1e10) / 1e10;
  return rounded.toLocaleString("pt-BR", { maximumFractionDigits: 10 });
}

function Calculadora() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [previous, setPrevious] = useState<number | null>(null);
  const [operator, setOperator] = useState<Op | null>(null);
  const [waiting, setWaiting] = useState(false);

  const isError = display.includes("Não é possível");

  const inputDigit = useCallback(
    (digit: string) => {
      if (isError) {
        setDisplay(digit);
        setExpression("");
        return;
      }
      if (waiting) {
        setDisplay(digit);
        setWaiting(false);
      } else {
        setDisplay((d) => (d === "0" ? digit : d + digit));
      }
    },
    [waiting, isError],
  );

  const inputDot = useCallback(() => {
    if (isError) {
      setDisplay("0,");
      return;
    }
    if (waiting) {
      setDisplay("0,");
      setWaiting(false);
      return;
    }
    if (!display.includes(",")) setDisplay((d) => d + ",");
  }, [display, waiting, isError]);

  const currentValue = useCallback(
    () => parseFloat(display.replace(/\./g, "").replace(",", ".")),
    [display],
  );

  const clearAll = useCallback(() => {
    setDisplay("0");
    setExpression("");
    setPrevious(null);
    setOperator(null);
    setWaiting(false);
  }, []);

  const clearEntry = useCallback(() => setDisplay("0"), []);

  const backspace = useCallback(() => {
    if (isError || waiting) return;
    setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
  }, [isError, waiting]);

  const chooseOperator = useCallback(
    (op: Op) => {
      if (isError) return;
      const value = currentValue();
      let base = value;
      if (previous === null) {
        setPrevious(value);
      } else if (operator && !waiting) {
        base = OPS[operator](previous, value);
        setPrevious(base);
        setDisplay(format(base));
      } else {
        base = previous;
      }
      setExpression(`${format(base)} ${op}`);
      setOperator(op);
      setWaiting(true);
    },
    [currentValue, previous, operator, waiting, isError],
  );

  const equals = useCallback(() => {
    if (operator === null || previous === null || isError) return;
    const value = currentValue();
    const result = OPS[operator](previous, value);
    setExpression(`${format(previous)} ${operator} ${format(value)} =`);
    setDisplay(format(result));
    setPrevious(null);
    setOperator(null);
    setWaiting(true);
  }, [operator, previous, currentValue, isError]);

  const unary = useCallback(
    (kind: "neg" | "sqr" | "sqrt" | "inv" | "pct") => {
      if (isError) return;
      const v = currentValue();
      let r = v;
      if (kind === "neg") r = -v;
      if (kind === "sqr") r = v * v;
      if (kind === "sqrt") r = Math.sqrt(v);
      if (kind === "inv") r = 1 / v;
      if (kind === "pct") r = previous !== null ? (previous * v) / 100 : v / 100;
      setDisplay(format(r));
      setWaiting(true);
    },
    [currentValue, previous, isError],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key;
      if (/\d/.test(k)) inputDigit(k);
      else if (k === ",") inputDot();
      else if (k === "+") chooseOperator("+");
      else if (k === "-") chooseOperator("−");
      else if (k === "*") chooseOperator("×");
      else if (k === "/") {
        e.preventDefault();
        chooseOperator("÷");
      } else if (k === "Enter" || k === "=") {
        e.preventDefault();
        equals();
      } else if (k === "Backspace") backspace();
      else if (k === "Escape") clearAll();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [inputDigit, inputDot, chooseOperator, equals, backspace, clearAll]);

  const fnBtn =
    "rounded-xl bg-calc-fn text-calc-fn-foreground font-medium text-sm transition-all duration-100 hover:bg-calc-fn-hover active:scale-[0.97]";
  const numBtn =
    "rounded-xl bg-calc-num text-calc-num-foreground font-semibold text-xl transition-all duration-100 hover:bg-calc-num-hover active:scale-[0.97]";
  const opBtn =
    "rounded-xl bg-calc-fn text-calc-fn-foreground font-medium text-xl transition-all duration-100 hover:bg-calc-fn-hover active:scale-[0.97]";

  return (
    <div className="flex min-h-screen items-center justify-center bg-calc-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex items-center gap-2 px-1">
          <span className="text-lg">🧮</span>
          <h1 className="font-display text-base font-semibold text-foreground">Padrão</h1>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-calc-panel p-4 shadow-2xl shadow-black/40">
          <div className="px-3 pb-3 pt-5 text-right">
            <div className="h-5 truncate text-sm text-muted-foreground">{expression}</div>
            <div
              className={`mt-1 truncate font-display font-semibold tracking-tight text-foreground ${
                isError ? "text-xl" : "text-5xl"
              }`}
            >
              {display}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 [&>button]:h-14">
            <button className={fnBtn} onClick={() => unary("pct")}>%</button>
            <button className={fnBtn} onClick={clearEntry}>CE</button>
            <button className={fnBtn} onClick={clearAll}>C</button>
            <button className={fnBtn} onClick={backspace} aria-label="Apagar">⌫</button>

            <button className={fnBtn} onClick={() => unary("inv")}>⅟x</button>
            <button className={fnBtn} onClick={() => unary("sqr")}>x²</button>
            <button className={fnBtn} onClick={() => unary("sqrt")}>√x</button>
            <button className={opBtn} onClick={() => chooseOperator("÷")}>÷</button>

            <button className={numBtn} onClick={() => inputDigit("7")}>7</button>
            <button className={numBtn} onClick={() => inputDigit("8")}>8</button>
            <button className={numBtn} onClick={() => inputDigit("9")}>9</button>
            <button className={opBtn} onClick={() => chooseOperator("×")}>×</button>

            <button className={numBtn} onClick={() => inputDigit("4")}>4</button>
            <button className={numBtn} onClick={() => inputDigit("5")}>5</button>
            <button className={numBtn} onClick={() => inputDigit("6")}>6</button>
            <button className={opBtn} onClick={() => chooseOperator("−")}>−</button>

            <button className={numBtn} onClick={() => inputDigit("1")}>1</button>
            <button className={numBtn} onClick={() => inputDigit("2")}>2</button>
            <button className={numBtn} onClick={() => inputDigit("3")}>3</button>
            <button className={opBtn} onClick={() => chooseOperator("+")}>+</button>

            <button className={numBtn} onClick={() => unary("neg")}>±</button>
            <button className={numBtn} onClick={() => inputDigit("0")}>0</button>
            <button className={numBtn} onClick={inputDot}>,</button>
            <button
              className="rounded-xl bg-calc-equals text-calc-equals-foreground text-xl font-semibold transition-all duration-100 hover:opacity-90 active:scale-[0.97]"
              onClick={equals}
            >
              =
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Dica: use o teclado — números, + − * /, Enter e Backspace.
        </p>
      </div>
    </div>
  );
}
