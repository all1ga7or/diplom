'use client';
import { useState } from 'react';

const sections = [
  { id: 'intro',   label: '1. Вступ' },
  { id: 'model',   label: '2. Математична модель' },
  { id: 'ga',      label: '3. Генетичний алгоритм' },
  { id: 'perturb', label: '4. Збурення' },
  { id: 'interp',  label: '5. Інтерпретація' },
  { id: 'glossary',label: '6. Глосарій' },
];

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="theory-accordion" style={{ marginBottom: 12 }}>
      <button className="theory-accordion-btn" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>
      {open && <div className="theory-accordion-body">{children}</div>}
    </div>
  );
}

export default function TheoryPage() {
  const [activeSection, setActiveSection] = useState('intro');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1>📖 Теоретичне підґрунтя</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 4 }}>
          Повний довідник з математичної моделі, генетичного алгоритму та інтерпретації результатів
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Sidebar navigation */}
        <nav className="theory-nav">
          {sections.map(s => (
            <button
              key={s.id}
              className={`theory-nav-item${activeSection === s.id ? ' active' : ''}`}
              onClick={() => scrollTo(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="theory-content">

          {/* ==================== 1. ВСТУП ==================== */}
          <section id="intro" className="theory-section">
            <h2>1. Вступ: Енергетична система та задача оптимізації</h2>

            <div className="theory-block">
              <p>
                Енергетична система — це складний комплекс взаємопов&apos;язаних економічних секторів (виробництво, транспорт, промисловість тощо),
                кожен з яких споживає та виробляє ресурси. Ефективність роботи такої системи залежить від <strong>оптимального розподілу ресурсів</strong> між секторами.
              </p>
              <p>
                У реальному світі енергетична система зазнає постійних <strong>збурень</strong> — змін вартості ресурсів, обсягів виробництва,
                технологічних параметрів. Задача полягає у тому, щоб <strong>адаптивно оптимізувати</strong> розподіл ресурсів,
                зберігаючи максимальну ефективність (пристосованість) навіть в умовах нестабільності.
              </p>
            </div>

            <div className="theory-highlight">
              <strong>🎯 Головна мета симулятора:</strong> продемонструвати, як еволюційний (генетичний) алгоритм
              знаходить оптимальний розподіл ресурсів між секторами енергетичної системи при різних сценаріях збурень.
            </div>

            <div className="theory-block">
              <h4>Що моделюється:</h4>
              <ul>
                <li><strong>m секторів</strong> енергетичної системи (від 2 до 10)</li>
                <li><strong>Матриця A</strong> — технологічні коефіцієнти міжсекторних зв&apos;язків</li>
                <li><strong>Вектор B</strong> — обсяги виробництва кожного сектору</li>
                <li><strong>Вектор C</strong> — вартісні характеристики секторів</li>
                <li><strong>Вектор u</strong> — керуючий вплив (розподіл ресурсів), який оптимізується</li>
              </ul>
            </div>
          </section>

          {/* ==================== 2. МАТЕМАТИЧНА МОДЕЛЬ ==================== */}
          <section id="model" className="theory-section">
            <h2>2. Математична модель</h2>

            <div className="theory-block">
              <p>
                Система описується як <strong>слабконелінійна модель</strong>, де взаємодія між секторами визначається
                матрицею технологічних коефіцієнтів <strong>A</strong> розмірністю m×m, а якість розподілу ресурсів
                оцінюється через цільову функцію.
              </p>
            </div>

            <Accordion title="📐 Цільова функція f(A, u)" defaultOpen={true}>
              <div className="theory-formula-block">
                <div className="theory-formula">
                  f(A, u) = Σᵢ Σⱼ aᵢⱼ · uⱼ + Σᵢ cᵢ · uᵢ → min
                </div>
                <p>
                  Цільова функція складається з двох компонентів:
                </p>
                <ul>
                  <li><strong>Σᵢ Σⱼ aᵢⱼ · uⱼ</strong> — вклад міжсекторних зв&apos;язків (матриця A × вектор u)</li>
                  <li><strong>Σᵢ cᵢ · uᵢ</strong> — прямі витрати по кожному сектору (вектор C × вектор u)</li>
                </ul>
                <p>
                  Генетичний алгоритм <strong>мінімізує</strong> цю функцію, знаходячи оптимальний вектор u*.
                </p>
              </div>
            </Accordion>

            <Accordion title="📊 Пристосованість Bu*">
              <div className="theory-formula-block">
                <div className="theory-formula">
                  Bu* = Σᵢ bᵢ · uᵢ*
                </div>
                <p>
                  Пристосованість — це <strong>скалярний добуток</strong> вектора виробництва B та оптимального вектору u*.
                  Вона показує сумарну корисність (продуктивність) системи при знайденому оптимальному розподілі ресурсів.
                </p>
                <p>
                  <strong>Чим вище Bu*</strong>, тим ефективніше працює система.
                </p>
              </div>
            </Accordion>

            <Accordion title="📈 Еко-ефект (%)">
              <div className="theory-formula-block">
                <div className="theory-formula">
                  Ефект = (Bu* − Bu₀) / Bu₀ × 100%
                </div>
                <p>де:</p>
                <ul>
                  <li><strong>Bu*</strong> — пристосованість з адаптованим (оптимальним) розподілом u*</li>
                  <li><strong>Bu₀</strong> — пристосованість з базовим розподілом u₀ = [1, 1, ..., 1]</li>
                </ul>
                <p>
                  Позитивний еко-ефект означає, що генетичний алгоритм знайшов розподіл, <strong>кращий за рівномірний</strong>. 
                  Негативний — що оптимізація призвела до погіршення (що трапляється рідко при правильних параметрах).
                </p>
              </div>
            </Accordion>

            <Accordion title="🔒 Обмеження на вектор u">
              <div className="theory-formula-block">
                <div className="theory-formula">
                  (1 − k) ≤ uᵢ ≤ (1 + k), для всіх i = 1..m
                </div>
                <p>
                  Параметр <strong>k</strong> визначає допустимий діапазон відхилень вектора u від базового значення 1.0.
                  Наприклад, при k = 0.1 кожен uᵢ може коливатись від 0.9 до 1.1.
                </p>
                <p>
                  Менше k → жорсткіші обмеження → менша свобода оптимізації.<br />
                  Більше k → більша свобода → потенційно кращий, але нестабільніший результат.
                </p>
              </div>
            </Accordion>
          </section>

          {/* ==================== 3. ГЕНЕТИЧНИЙ АЛГОРИТМ ==================== */}
          <section id="ga" className="theory-section">
            <h2>3. Генетичний алгоритм (ГА)</h2>

            <div className="theory-block">
              <p>
                Генетичний алгоритм — це метаевристичний метод оптимізації, натхненний теорією еволюції Дарвіна.
                Він імітує процеси <strong>природного відбору</strong>, де найкращі рішення &quot;виживають&quot; і дають &quot;потомство&quot;.
              </p>
            </div>

            <div className="theory-steps">
              <div className="theory-step">
                <div className="theory-step-num">1</div>
                <div>
                  <h4>Ініціалізація популяції</h4>
                  <p>Генерується <strong>N особин</strong> (кандидатних рішень). Кожна особина — це вектор чисел, що кодує матрицю A та вектор u.</p>
                </div>
              </div>
              <div className="theory-step">
                <div className="theory-step-num">2</div>
                <div>
                  <h4>Оцінка фітнесу</h4>
                  <p>Для кожної особини обчислюється значення цільової функції f(A, u). Чим менше f — тим краща особина.</p>
                </div>
              </div>
              <div className="theory-step">
                <div className="theory-step-num">3</div>
                <div>
                  <h4>Селекція (відбір)</h4>
                  <p>Турнірний відбір: випадково обирається група особин, найкраща з яких стає «батьком». Кращі рішення мають більше шансів бути обраними.</p>
                </div>
              </div>
              <div className="theory-step">
                <div className="theory-step-num">4</div>
                <div>
                  <h4>Кросовер (схрещення)</h4>
                  <p>Два батьки комбінуються для створення нащадка. Використовується <strong>рівномірний кросовер</strong>: кожен ген випадково береться від одного з батьків.</p>
                </div>
              </div>
              <div className="theory-step">
                <div className="theory-step-num">5</div>
                <div>
                  <h4>Мутація</h4>
                  <p>Випадкові гени нащадка змінюються з ймовірністю <strong>p_mut</strong>. Це забезпечує різноманітність та дозволяє відкривати нові трільення простору рішень.</p>
                </div>
              </div>
              <div className="theory-step">
                <div className="theory-step-num">6</div>
                <div>
                  <h4>Елітизм</h4>
                  <p>Найкращі 10% особин <strong>гарантовано переходять</strong> у наступне покоління без змін. Це запобігає втраті вже знайдених хороших рішень.</p>
                </div>
              </div>
              <div className="theory-step">
                <div className="theory-step-num">⟲</div>
                <div>
                  <h4>Повторення</h4>
                  <p>Кроки 2–6 повторюються <strong>G поколінь</strong>. З кожним поколінням популяція «еволюціонує» до кращих рішень.</p>
                </div>
              </div>
            </div>

            <div className="theory-highlight">
              <strong>💡 Параметри ГА у симуляторі:</strong>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li><strong>Популяція (N)</strong> — кількість особин. Більше = точніший, але повільніший пошук.</li>
                <li><strong>Покоління (G)</strong> — скільки циклів еволюції. Більше = більше часу для конвергенції.</li>
                <li><strong>Ймовірність мутації</strong> — баланс між розвідкою નових рішень та експлуатацією знайдених.</li>
              </ul>
            </div>
          </section>

          {/* ==================== 4. ЗБУРЕННЯ ==================== */}
          <section id="perturb" className="theory-section">
            <h2>4. Сценарії збурень</h2>

            <div className="theory-block">
              <p>
                У реальності параметри енергетичної системи <strong>змінюються з часом</strong>: зростають ціни, змінюються
                обсяги виробництва, оновлюються технології. У нашій моделі це реалізується через <strong>вектори збурень</strong>:
              </p>
            </div>

            <div className="theory-table-wrap">
              <table className="theory-table">
                <thead>
                  <tr>
                    <th>Параметр</th>
                    <th>Що збурює</th>
                    <th>Формула</th>
                    <th>Приклад</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong style={{ color: '#f87171' }}>α (альфа)</strong></td>
                    <td>Вартість (вектор C)</td>
                    <td>C&apos; = C₀ × α</td>
                    <td>α=1.2 → вартість зросла на 20%</td>
                  </tr>
                  <tr>
                    <td><strong style={{ color: '#38bdf8' }}>β (бета)</strong></td>
                    <td>Виробництво (вектор B)</td>
                    <td>B&apos; = B₀ × β</td>
                    <td>β=0.8 → виробництво впало на 20%</td>
                  </tr>
                  <tr>
                    <td><strong style={{ color: '#a78bfa' }}>γ (гамма)</strong></td>
                    <td>Технологія (матриця A)</td>
                    <td>A&apos; = A₀ × γ</td>
                    <td>γ=1.1 → технологічне зростання 10%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Accordion title="🎲 Автоматичний режим">
              <p>
                Збурення генеруються <strong>випадковим чином</strong> у діапазоні [1−k, 1+k] на кожному кроці t.
                Це моделює <strong>непередбачувані</strong> зміни ринку. Додатково можна обрати заданий <strong>сценарій</strong> —
                фіксований набір α, β, γ (створюється в менеджері сценаріїв).
              </p>
            </Accordion>

            <Accordion title="🎛️ Ручний режим">
              <p>
                Дозволяє <strong>викладачу чи дослідникy</strong> вручну задавати збурення на кожному кроці через вертикальні стрілки.
                Ідеально для демонстрації: «Що буде, якщо ціна на ресурс зросте на 30% при зменшенні виробництва?»
              </p>
            </Accordion>

            <div className="theory-highlight">
              <strong>📌 Збурення T (кількість кроків)</strong> — це кількість ітерацій симуляції. На кожному кроці:
              <ol style={{ marginTop: 8, marginBottom: 0 }}>
                <li>ГА оптимізує вектор u* для поточних A, B, C</li>
                <li>Обчислюються фітнес, пристосованість, еко-ефект</li>
                <li>Застосовуються збурення α, β, γ → формуються нові A, B, C для наступного кроку</li>
              </ol>
            </div>
          </section>

          {/* ==================== 5. ІНТЕРПРЕТАЦІЯ ==================== */}
          <section id="interp" className="theory-section">
            <h2>5. Інтерпретація результатів</h2>

            <div className="theory-block">
              <p>Після завершення симуляції ви побачите декілька графіків. Ось як їх读читати:</p>
            </div>

            <div className="theory-cards-grid">
              <div className="theory-card">
                <h4>📊 Пристосованість (Bu*)</h4>
                <p>Показує адаптовану (синя лінія) та базову (червона пунктирна) пристосованість системи на кожному кроці. Чим вище синя лінія над червоною — тим ефективніша оптимізація.</p>
              </div>
              <div className="theory-card">
                <h4>🎯 Цільова функція</h4>
                <p>Значення f(A,u) на кожному кроці. Генетичний алгоритм мінімізує цю функцію. Стабільно низькі значення — знак хорошої адаптації.</p>
              </div>
              <div className="theory-card">
                <h4>📈 Еко-ефект (%)</h4>
                <p>Відсоткова різниця між адаптованою та базовою пристосованістю. Зелені точки — позитивний ефект, червоні — негативний.</p>
              </div>
              <div className="theory-card">
                <h4>🔢 Матриця A / Вектори B, C, u</h4>
                <p>Динаміка кожного елемента матриці або вектора по кроках. Дозволяє побачити, як збурення впливають на окремі компоненти системи.</p>
              </div>
              <div className="theory-card">
                <h4>🎛️ Збурення α, β, γ</h4>
                <p>Графіки значень коефіцієнтів збурень по кроках. Пунктирна лінія на рівні 1.0 — базова (без змін). Відхилення вгору/вниз показують інтенсивність збурень.</p>
              </div>
            </div>
          </section>

          {/* ==================== 6. ГЛОСАРІЙ ==================== */}
          <section id="glossary" className="theory-section">
            <h2>6. Глосарій термінів</h2>

            <div className="theory-table-wrap">
              <table className="theory-table">
                <thead>
                  <tr>
                    <th>Позначення</th>
                    <th>Назва</th>
                    <th>Пояснення</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td><strong>m</strong></td><td>Розмірність</td><td>Кількість секторів енергетичної системи</td></tr>
                  <tr><td><strong>A</strong></td><td>Матриця технологічних коеф.</td><td>m×m матриця міжсекторних зв&apos;язків</td></tr>
                  <tr><td><strong>B</strong></td><td>Вектор виробництва</td><td>Обсяги виробництва по секторах</td></tr>
                  <tr><td><strong>C</strong></td><td>Вектор вартості</td><td>Вартісні характеристики секторів</td></tr>
                  <tr><td><strong>u</strong></td><td>Вектор керування</td><td>Розподіл ресурсів (оптимізується ГА)</td></tr>
                  <tr><td><strong>u*</strong></td><td>Оптимальний u</td><td>Найкращий розподіл, знайдений ГА</td></tr>
                  <tr><td><strong>k</strong></td><td>Параметр збурення</td><td>Визначає діапазон допустимих значень uᵢ</td></tr>
                  <tr><td><strong>T</strong></td><td>Кількість збурень</td><td>Скільки кроків симуляції виконати</td></tr>
                  <tr><td><strong>N</strong></td><td>Популяція</td><td>Кількість особин в ГА</td></tr>
                  <tr><td><strong>G</strong></td><td>Покоління</td><td>Кількість ітерацій еволюції ГА</td></tr>
                  <tr><td><strong>α</strong></td><td>Збурення вартості</td><td>Мультиплікатор для вектора C</td></tr>
                  <tr><td><strong>β</strong></td><td>Збурення виробництва</td><td>Мультиплікатор для вектора B</td></tr>
                  <tr><td><strong>γ</strong></td><td>Збурення технології</td><td>Мультиплікатор для матриці A</td></tr>
                  <tr><td><strong>f(A,u)</strong></td><td>Цільова функція</td><td>Мінімізується ГА для знаходження оптимуму</td></tr>
                  <tr><td><strong>Bu*</strong></td><td>Пристосованість</td><td>Корисність системи при оптимальному u*</td></tr>
                  <tr><td><strong>Еко-ефект</strong></td><td>Відносний ефект</td><td>% покращення Bu* відносно базового Bu₀</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
