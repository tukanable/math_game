// Состояние игры
let currentProblem = null;
let floorCount = 0;
let problemCount = 0; // Счётчик решённых примеров для простого режима
let record = parseInt(localStorage.getItem('mathGameRecord')) || 0;

// DOM элементы
const problemEl = document.getElementById('problem');
const hintEl = document.getElementById('hint');
const answerEl = document.getElementById('answer');
const checkBtn = document.getElementById('checkBtn');
const feedbackEl = document.getElementById('feedback');
const floorCountEl = document.getElementById('floorCount');
const recordCountEl = document.getElementById('recordCount');
const buildingEl = document.getElementById('building');
const hintModeEl = document.getElementById('hintMode');
const additionOpEl = document.getElementById('additionOp');
const subtractionOpEl = document.getElementById('subtractionOp');

// Инициализация
function init() {
    recordCountEl.textContent = record;
    generateProblem();

    checkBtn.addEventListener('click', checkAnswer);
    answerEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });

    hintModeEl.addEventListener('change', updateHintVisibility);

    // Следим за изменением операций
    additionOpEl.addEventListener('change', ensureAtLeastOneOperation);
    subtractionOpEl.addEventListener('change', ensureAtLeastOneOperation);
}

// Убеждаемся, что хотя бы одна операция выбрана
function ensureAtLeastOneOperation(e) {
    if (!additionOpEl.checked && !subtractionOpEl.checked) {
        e.target.checked = true;
    }
    generateProblem();
}

// Проверка босс-раунда (каждый 10-й этаж)
function isBossRound() {
    return (floorCount + 1) % 10 === 0 && floorCount > 0;
}

// Генерация задачи
function generateProblem() {
    const operations = [];
    if (additionOpEl.checked) operations.push('+');
    if (subtractionOpEl.checked) operations.push('-');

    const operation = operations[Math.floor(Math.random() * operations.length)];

    let num1, num2;

    // Босс-раунд — трёхзначные числа
    const isBoss = isBossRound();

    if (isBoss) {
        document.body.classList.add('boss-mode');

        if (operation === '+') {
            // Одно трёхзначное (100-899), другое двузначное
            num1 = Math.floor(Math.random() * 800) + 100; // 100-899
            num2 = Math.floor(Math.random() * 90) + 10;   // 10-99
        } else {
            // Трёхзначное минус двузначное
            num1 = Math.floor(Math.random() * 800) + 100; // 100-899
            num2 = Math.floor(Math.random() * 90) + 10;   // 10-99
        }
    } else {
        document.body.classList.remove('boss-mode');

        // Первые 5 примеров - простые (без переноса разряда)
        const isSimpleMode = problemCount < 5;

        if (operation === '+') {
            if (isSimpleMode) {
                // Простое сложение: сумма единиц <= 9, сумма десятков <= 9
                const tens1 = Math.floor(Math.random() * 5) + 1; // 1-5
                const tens2 = Math.floor(Math.random() * (9 - tens1)) + 1; // чтобы сумма <= 9
                const ones1 = Math.floor(Math.random() * 5) + 1; // 1-5
                const ones2 = Math.floor(Math.random() * (9 - ones1)) + 1; // чтобы сумма <= 9
                num1 = tens1 * 10 + ones1;
                num2 = tens2 * 10 + ones2;
            } else {
                // Обычное сложение: оба числа от 10 до 99
                num1 = Math.floor(Math.random() * 90) + 10;
                num2 = Math.floor(Math.random() * 90) + 10;
            }
        } else {
            if (isSimpleMode) {
                // Простое вычитание: единицы первого >= единиц второго
                const tens1 = Math.floor(Math.random() * 5) + 4; // 4-8
                const tens2 = Math.floor(Math.random() * tens1) + 1; // меньше tens1
                const ones1 = Math.floor(Math.random() * 5) + 4; // 4-8
                const ones2 = Math.floor(Math.random() * ones1) + 1; // меньше ones1
                num1 = tens1 * 10 + ones1;
                num2 = tens2 * 10 + ones2;
            } else {
                // Обычное вычитание
                num1 = Math.floor(Math.random() * 90) + 10;
                num2 = Math.floor(Math.random() * (num1 - 10)) + 10;
                if (num2 < 10) num2 = 10;
            }
        }
    }

    const answer = operation === '+' ? num1 + num2 : num1 - num2;

    currentProblem = { num1, num2, operation, answer, isBoss };

    const opSymbol = operation === '+' ? '+' : '−';
    problemEl.textContent = `${num1} ${opSymbol} ${num2} = ?`;

    updateHint();
    updateHintVisibility();

    answerEl.value = '';
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    answerEl.focus();
}

// Обновление подсказки
function updateHint() {
    const { num1, num2, operation } = currentProblem;

    const tens1 = Math.floor(num1 / 10) * 10;
    const ones1 = num1 % 10;
    const tens2 = Math.floor(num2 / 10) * 10;
    const ones2 = num2 % 10;

    let hintText;

    if (operation === '+') {
        // Для сложения: разбиваем на десятки и единицы
        hintText = `${tens1} + ${tens2} + ${ones1} + ${ones2}`;
    } else {
        // Для вычитания: показываем пошаговое вычитание
        // Сначала вычитаем десятки, потом единицы
        hintText = `${num1} − ${tens2} − ${ones2}`;

        // Или альтернативный вариант с промежуточным результатом
        const afterTens = num1 - tens2;
        hintText = `(${num1} − ${tens2}) − ${ones2} = ${afterTens} − ${ones2}`;
    }

    hintEl.textContent = hintText;
}

// Показать/скрыть подсказку
function updateHintVisibility() {
    if (hintModeEl.checked) {
        hintEl.classList.remove('hidden');
    } else {
        hintEl.classList.add('hidden');
    }
}

// Проверка ответа
function checkAnswer() {
    const userAnswer = parseInt(answerEl.value);

    if (isNaN(userAnswer)) {
        feedbackEl.textContent = 'Введи число!';
        feedbackEl.className = 'feedback wrong';
        return;
    }

    if (userAnswer === currentProblem.answer) {
        // Правильный ответ
        feedbackEl.textContent = 'Правильно! Отлично!';
        feedbackEl.className = 'feedback correct';

        floorCount++;
        problemCount++;
        floorCountEl.textContent = floorCount;

        // Проверка рекорда
        if (floorCount > record) {
            record = floorCount;
            localStorage.setItem('mathGameRecord', record);
            recordCountEl.textContent = record;
        }

        addFloor();

        // Следующая задача через небольшую паузу
        setTimeout(generateProblem, 1000);
    } else {
        // Неправильный ответ
        feedbackEl.textContent = `Неправильно! Было: ${currentProblem.answer}`;
        feedbackEl.className = 'feedback wrong';

        collapseBuilding();
    }
}

// Добавить этаж
function addFloor() {
    const floor = document.createElement('div');

    // Для тестов: каждый 5-й этаж — босс-этаж
    const isBossFloor = floorCount % 5 === 0;

    floor.className = isBossFloor ? 'floor boss-floor' : 'floor';

    // Босс-этаж в 3 раза выше
    if (isBossFloor) {
        floor.dataset.bossFloor = 'true';

        // Побеждённая рожа босса
        const bossface = document.createElement('div');
        bossface.className = 'boss-face';
        bossface.innerHTML = '😈';
        floor.appendChild(bossface);
    } else if (floorCount === 1) {
        // Первый этаж с дверью
        const window1 = document.createElement('div');
        window1.className = 'window';
        const door = document.createElement('div');
        door.className = 'door';
        const window2 = document.createElement('div');
        window2.className = 'window';

        floor.appendChild(window1);
        floor.appendChild(door);
        floor.appendChild(window2);
    } else {
        // Остальные этажи с окнами
        for (let i = 0; i < 3; i++) {
            const window = document.createElement('div');
            window.className = 'window';
            floor.appendChild(window);
        }
    }

    buildingEl.appendChild(floor);

    // Масштабирование здания
    scaleBuilding();
}

// Масштабирование здания
function scaleBuilding() {
    const maxHeight = 480; // максимальная высота здания в пикселях
    const baseFloorHeight = 60;
    const bossMultiplier = 3;

    // Подсчитываем реальную высоту с учётом босс-этажей
    const floors = buildingEl.querySelectorAll('.floor');
    let totalHeight = 0;
    floors.forEach(floor => {
        if (floor.dataset.bossFloor) {
            totalHeight += baseFloorHeight * bossMultiplier;
        } else {
            totalHeight += baseFloorHeight;
        }
    });

    const scale = totalHeight > maxHeight ? maxHeight / totalHeight : 1;

    const floorHeight = Math.floor(baseFloorHeight * scale);
    const bossFloorHeight = Math.floor(baseFloorHeight * bossMultiplier * scale);
    const floorWidth = Math.floor(180 * scale);
    const bossFloorWidth = Math.floor(220 * scale);
    const windowSize = Math.floor(35 * scale);

    floors.forEach(floor => {
        const isBoss = floor.dataset.bossFloor;
        floor.style.height = (isBoss ? bossFloorHeight : floorHeight) + 'px';
        floor.style.width = (isBoss ? bossFloorWidth : floorWidth) + 'px';

        const windows = floor.querySelectorAll('.window');
        const winHeight = isBoss ? Math.floor(windowSize * 2.5) : Math.floor(windowSize * 1.14);
        windows.forEach(w => {
            w.style.width = windowSize + 'px';
            w.style.height = winHeight + 'px';
        });

        const door = floor.querySelector('.door');
        if (door) {
            door.style.width = Math.floor(windowSize * 1.14) + 'px';
            door.style.height = Math.floor(windowSize * 1.43) + 'px';
        }

        const bossFace = floor.querySelector('.boss-face');
        if (bossFace) {
            bossFace.style.fontSize = Math.floor(50 * scale) + 'px';
        }
    });
}

// Разрушение здания
function collapseBuilding() {
    document.body.classList.remove('boss-mode');
    const floors = buildingEl.querySelectorAll('.floor');

    if (floors.length === 0) {
        setTimeout(generateProblem, 1500);
        return;
    }

    // Анимация падения этажей сверху вниз
    let delay = 0;
    for (let i = floors.length - 1; i >= 0; i--) {
        setTimeout(() => {
            floors[i].classList.add('collapsing');
        }, delay);
        delay += 150;
    }

    // Очистка и новая задача
    setTimeout(() => {
        buildingEl.innerHTML = '';
        buildingEl.style.transform = 'scale(1)';
        floorCount = 0;
        floorCountEl.textContent = 0;
        generateProblem();
    }, delay + 500);
}

// Запуск игры
init();
