/* SYNCO EN/RU switch — translates rendered text, placeholders and titles in place. */
(function(){
  var KEY='synco-lang';
  var lang=localStorage.getItem(KEY)||'en';
  var MON={Jan:'янв',Feb:'фев',Mar:'мар',Apr:'апр',May:'мая',Jun:'июн',Jul:'июл',Aug:'авг',Sep:'сен',Oct:'окт',Nov:'ноя',Dec:'дек'};
  var UP={MARKETING:'МАРКЕТИНГ',DEVELOPMENT:'РАЗРАБОТКА',SALES:'ПРОДАЖИ'};
  var D={
    // nav + common
    'Work Flow':'Поток работ','Assign Work':'Распределение','Goals':'Цели','Brainstorm':'Брейншторм',
    'REGAGRO · Owner view':'REGAGRO · вид владельца','Today · Wed, Jun 24':'Сегодня · ср, 24 июня','Wed, Jun 24 · live':'ср, 24 июня · онлайн',
    'Marketing':'Маркетинг','Development':'Разработка','Sales':'Продажи','Owner':'Владелец',
    'To Do':'К выполнению','In Progress':'В работе','In Review':'На проверке','Final Review':'Финальная проверка','Needs Revision':'На доработку','Done':'Готово',
    'High':'Высокий','Medium':'Средний','Low':'Низкий',
    'Design':'Дизайн','Social':'Соцсети','Content':'Контент','Strategy':'Стратегия','Backend':'Бэкенд','Frontend':'Фронтенд','Pricing':'Цены','Outreach':'Аутрич','Request':'Запрос','Planning':'Планирование','Ops':'Операции','Team':'Команда','Research':'Исследование',
    'Content Lead':'Контент-лид','Designer':'Дизайнер','Tech Lead':'Техлид','Sales Lead':'Руководитель продаж','Account Exec':'Аккаунт-менеджер','Marketing Lead':'Руководитель маркетинга',
    'Team Lead':'Тимлид','just now':'только что','yesterday':'вчера','Cancel':'Отмена','Approve':'Одобрить','Close':'Закрыть','Add':'Добавить',
    'Due':'Срок:','from':'от','of':'из','tasks':'задач','members':'участника','min':'мин','ideas':'идей','· due':'· срок','· by':'· автор:',
    'Sync Mind':'Синк','Deadline':'Дедлайн','Assignee':'Исполнитель','Source':'Источник','Priority':'Приоритет','Goal':'Цель','Tag':'Тег',
    'COMMENTS':'КОММЕНТАРИИ','No comments yet.':'Комментариев пока нет.','Add a comment…':'Добавить комментарий…','Write a comment…':'Написать комментарий…',
    'Time in progress':'Время в работе','Not started':'Не начато','In review':'На проверке','In progress':'В работе','EFFICIENCY':'ЭФФЕКТИВНОСТЬ','BATTERY':'БАТАРЕЯ',
    // goals
    'G1 · Launch':'G1 · Запуск','G2 · EMEA':'G2 · EMEA','G3 · Onboarding':'G3 · Онбординг','Launch':'Запуск','Onboarding':'Онбординг',
    'Launch new product by September 1':'Запустить новый продукт к 1 сентября','Enter the EMEA market in Q4':'Выйти на рынок EMEA в IV квартале','Cut onboarding time by 30%':'Сократить время онбординга на 30%',
    // flow
    'Dashboard / Department Flow':'Дашборд / Поток отделов','REGAGRO · Work Flow':'REGAGRO · Поток работ',
    'Each department runs its own thread — all reviewed work flows into Sync Mind.':'У каждого отдела своя ветка — вся проверенная работа стекается в Синк.',
    'Requests':'Запросы','GOAL':'ЦЕЛЬ','All goals':'Все цели','View goal puzzles →':'Пазлы целей →',
    'From Owner':'От владельца','★ Priority request':'★ Приоритетный запрос','Reviewer ·':'Проверяющий ·','in review':'на проверке',
    'AI · KNOWLEDGE BASE':'AI · БАЗА ЗНАНИЙ','All approved docs land here. Ask Sync Mind to compile a set by theme or task.':'Сюда попадают все одобренные документы. Попросите Синк собрать подборку по теме или задаче.',
    'Responsible':'Ответственный','REVIEW CHAIN':'ЦЕПОЧКА ПРОВЕРКИ',
    "Two-stage review: this team's lead checks first, then the requester signs off.":'Двухэтапная проверка: сначала лид этой команды, затем финальное слово за отправителем.',
    'Whoever assigned the task reviews it.':'Кто поставил задачу — тот её и проверяет.',
    'EXECUTOR':'ИСПОЛНИТЕЛЬ','STAGE 1':'ЭТАП 1','STAGE 2':'ЭТАП 2','FINAL':'ФИНАЛ','REQUESTER':'ОТПРАВИТЕЛЬ','REVIEWER':'ПРОВЕРЯЮЩИЙ','ASSIGNED THIS TASK':'ПОСТАВИЛ ЗАДАЧУ',
    'Submitted':'Сдано','Approved':'Одобрено','Revising after feedback':'Дорабатывает по замечаниям','Working on it':'В работе','Reviewing now':'Проверяет сейчас','Waiting':'Ожидает',
    'REVIEWER QUEUE':'ОЧЕРЕДЬ ПРОВЕРКИ','DOCUMENTS IN REVIEW':'ДОКУМЕНТЫ НА ПРОВЕРКЕ','Approve → Sync Mind':'Одобрить → Синк','Request changes':'Вернуть на доработку',
    'Notes for':'Замечания для','What needs to change before this can be approved?':'Что нужно исправить перед одобрением?','Send back to':'Вернуть:','Review queue is clear.':'Очередь проверки пуста.',
    "Approve to release a document into Sync Mind's knowledge base — or send it back with notes, and it returns to the team thread marked “Needs Revision”.":'Одобрите — и документ попадёт в базу знаний Синка. Или верните с замечаниями: задача вернётся в ветку команды со статусом «На доработку».',
    'REQUESTS':'ЗАПРОСЫ','Requests between departments':'Запросы между отделами',
    'Team Leads send regular requests. Only C-Level can send priority requests. The receiving team accepts, or declines with a reason.':'Тимлиды отправляют обычные запросы, приоритетные — только C-Level. Получатель принимает запрос или отклоняет с причиной.',
    'New request':'Новый запрос','Send as':'Отправить от имени','To department':'В отдел','What do you need?':'Что нужно?','e.g. Product screenshots for the partner deck':'Например: скриншоты продукта для презентации партнёрам',
    'Type':'Тип','Regular':'Обычный','★ Priority':'★ Приоритетный',
    'Priority — jumps ahead of Team Lead tasks in their queue.':'Приоритетный — встаёт в очереди перед задачами тимлида.',
    "Regular — queued after the team's own priorities.":'Обычный — после собственных приоритетов команды.',
    'Only C-Level can send priority requests. Team Lead requests are always regular.':'Приоритетные запросы может отправлять только C-Level. Запросы тимлидов всегда обычные.',
    'Send request →':'Отправить запрос →','WAITING FOR A DECISION':'ЖДУТ РЕШЕНИЯ','REGULAR':'ОБЫЧНЫЙ','★ PRIORITY · C-LEVEL':'★ ПРИОРИТЕТ · C-LEVEL',
    'Accept → To Do':'Принять → К выполнению','Decline':'Отклонить',"Why can't your team take this on? The sender will see this.":'Почему команда не может взяться? Отправитель увидит причину.',
    'Send decline':'Отклонить запрос','No open requests.':'Открытых запросов нет.','HISTORY':'ИСТОРИЯ','ACCEPTED':'ПРИНЯТ','DECLINED':'ОТКЛОНЁН',
    "Clients haven't approved logo use yet — revisit in October.":'Клиенты пока не разрешили использовать логотипы — вернёмся к этому в октябре.','No capacity this sprint.':'Нет ресурса в этом спринте.',
    'AI KNOWLEDGE AGENT':'AI-АГЕНТ ЗНАНИЙ','ASK SYNC MIND':'СПРОСИТЕ СИНК',
    'Describe a theme or task. Sync Mind pulls only the related approved docs from every department and assembles them.':'Опишите тему или задачу — Синк соберёт только связанные одобренные документы из всех отделов.',
    'Compile document set':'Собрать подборку','COMPILED SET':'ПОДБОРКА','Export bundle':'Экспортировать',
    'Everything launch-related for September':'Всё по сентябрьскому запуску','Pricing + go-to-market docs only':'Только цены и go-to-market','All approved technical specs':'Все одобренные техспецификации',
    'Combine all launch-related documents for the September release':'Собери все документы по сентябрьскому запуску',
    'Launch landing page spec':'ТЗ лендинга запуска','Product API contract':'Контракт API продукта','Pricing tiers v1':'Тарифы v1',
    // task titles
    'Design product launch landing page':'Дизайн лендинга запуска продукта','Design launch landing page':'Дизайн лендинга запуска','Social media launch calendar':'Контент-план соцсетей к запуску',
    'Write blog announcement':'Статья-анонс для блога','Welcome email series':'Серия приветственных писем','Build product API':'Разработать API продукта','Empty-state redesign':'Редизайн пустых состояний',
    'EU region deployment':'Развёртывание в EU-регионе','Prepare pricing tiers':'Подготовить тарифы','Draft outreach list':'Список для аутрича','Frontend dashboard shell':'Каркас фронтенда дашборда',
    'Add Stripe test mode for demo accounts':'Тестовый режим Stripe для демо-аккаунтов','One-pager for EMEA partners':'One-pager для партнёров EMEA','Share top-20 prospect logos for a case study':'Логотипы топ-20 клиентов для кейса',
    'Campaign brief':'Бриф кампании','Set up CI pipeline':'Настроить CI-пайплайн','Release QA pass':'Финальное тестирование релиза','Sales demo script':'Скрипт демо для продаж','Design-partner contracts':'Договоры с дизайн-партнёрами',
    'EMEA positioning one-pager':'One-pager позиционирования для EMEA','Localized landing pages':'Локализованные лендинги','GDPR data-residency check':'Проверка хранения данных по GDPR',
    'Multi-currency billing':'Мультивалютный биллинг','EMEA partner shortlist':'Шорт-лист партнёров EMEA','First 10 EMEA demos':'Первые 10 демо в EMEA','Reseller agreement draft':'Черновик договора с реселлером',
    'Onboarding video script':'Сценарий видео для онбординга','In-app tooltip copy':'Тексты подсказок в приложении','Import from FigJam':'Импорт из FigJam','Customer kickoff checklist':'Чек-лист старта с клиентом',
    'Refresh brand illustration set':'Обновить набор бренд-иллюстраций','Social ad creative — round 2':'Рекламные креативы для соцсетей — раунд 2','Update component library tokens':'Обновить токены библиотеки компонентов',
    'Email template visual polish':'Доработать визуал email-шаблона','Pitch deck cover concepts':'Концепты обложки презентации','Draft weekly priorities':'Составить приоритеты недели',
    'Review incoming requests':'Разобрать входящие запросы','Sync notes for standup':'Заметки к стендапу','Close out last sprint items':'Закрыть задачи прошлого спринта',
    'Define launch campaign brief':'Бриф кампании запуска','Design landing page':'Дизайн лендинга','Competitor research':'Анализ конкурентов','Email newsletter draft':'Черновик рассылки','Social media calendar':'Контент-план соцсетей','Brand guidelines update':'Обновление брендбука',
    // descriptions + comments
    'Build the responsive landing page for the September launch — hero, feature highlights, pricing, and the request-access CTA.':'Адаптивный лендинг к сентябрьскому запуску: первый экран, ключевые функции, тарифы и CTA «Запросить доступ».',
    'Responsive landing page for the September launch: hero, feature highlights, pricing and the request-access CTA.':'Адаптивный лендинг к сентябрьскому запуску: первый экран, ключевые функции, тарифы и CTA «Запросить доступ».',
    'Six-week posting plan across LinkedIn, X and Instagram tied to the launch milestones.':'План публикаций на шесть недель в LinkedIn, X и Instagram по этапам запуска.',
    'Long-form launch announcement for the company blog with product framing and customer quotes.':'Большая статья-анонс для блога компании: позиционирование продукта и цитаты клиентов.',
    'Three-email welcome sequence for new workspaces.':'Цепочка из трёх приветственных писем для новых пространств.',
    'Core REST + webhook API powering the new product surface, with auth and rate limiting.':'Основной REST API и вебхуки нового продукта — с авторизацией и лимитами запросов.',
    'Replace the blank dashboard with a guided 3-step start.':'Заменить пустой дашборд пошаговым стартом из трёх шагов.',
    'Move workspace data for EU customers to the Frankfurt region.':'Перенести данные EU-клиентов в регион Франкфурт.',
    'Three-tier pricing with feature gating and an enterprise contact path.':'Три тарифа с разграничением функций и отдельным путём для enterprise.',
    'Marketing asked for a segmented prospect list to target with the EMEA campaign.':'Маркетинг запросил сегментированный список потенциальных клиентов для кампании в EMEA.',
    'Update the 12 spot illustrations to the new palette and line weight.':'Перевести 12 иллюстраций на новую палитру и толщину линий.',
    'Three variants for LinkedIn and Instagram based on round-1 feedback.':'Три варианта для LinkedIn и Instagram по итогам первого раунда.',
    'Sync color and radius tokens with the latest brand guidelines.':'Синхронизировать токены цвета и скруглений с новым брендбуком.',
    'Tighten spacing and typography on the launch email template.':'Подтянуть отступы и типографику в письме о запуске.',
    'Two or three cover directions for the investor update deck.':'Два-три варианта обложки для презентации инвесторам.',
    'Details for this task are provided by your manager.':'Подробности задачи добавит менеджер.',
    'Hero copy approved — keep the CTA above the fold.':'Текст первого экрана утверждён — CTA оставляем на первом экране.',
    'Hero copy is approved — keep the CTA above the fold.':'Текст первого экрана утверждён — CTA оставляем на первом экране.',
    'Hero copy is approved — let\'s keep the CTA above the fold.':'Текст первого экрана утверждён — CTA оставляем на первом экране.',
    'On it. First draft ready for review by EOD.':'Беру. Первый вариант пришлю на проверку до конца дня.','Looks solid, sending to review.':'Выглядит хорошо, отправляю на проверку.',
    'Approved and archived.':'Одобрено и в архиве.','Add pagination to the /tasks endpoint before review.':'Перед проверкой добавьте пагинацию в /tasks.',
    'Ready — submitting for review.':'Готово — сдаю на проверку.','Verified. Done.':'Проверено. Готово.','We need this to plan the EMEA ads.':'Это нужно для планирования рекламы в EMEA.',
    'First pass done — sending for review.':'Первая версия готова — отправляю на проверку.','Please revise and resubmit.':'Пожалуйста, доработайте и сдайте снова.',
    'Variant B performed best — lean into that layout.':'Лучше всего сработал вариант B — опирайся на этот макет.','On it. First draft ready for review by EOD.':'Беру. Первый вариант пришлю на проверку до конца дня.',
    // assign
    'assigned':'назначено','✦ Suggest assignments':'✦ Предложить назначения','Approve all suggested':'Одобрить все предложения','Unassigned':'Не назначено','drag → or Assign ▾':'перетащите → или «Назначить ▾»',
    '✦ AI SUGGESTS':'✦ AI ПРЕДЛАГАЕТ','Balanced — keeps the team under capacity':'Сбалансировано — команда не перегружена','Change ▾':'Изменить ▾','Assign':'Назначить',
    'CHOOSE ASSIGNEE':'ВЫБЕРИТЕ ИСПОЛНИТЕЛЯ','DELEGATE TO TEAM LEAD':'ПЕРЕДАТЬ ТИМЛИДУ','ASSIGN DIRECTLY TO MEMBER':'НАЗНАЧИТЬ СОТРУДНИКУ НАПРЯМУЮ',"Everything's assigned. 🎉":'Всё распределено. 🎉',
    'Teams':'Команды','LEAD:':'ЛИД:',"ON THE LEAD'S DESK · DELEGATE ↓":'НА СТОЛЕ У ЛИДА · ПЕРЕДАТЬ ↓','Delegate ▾':'Передать ▾','Nothing waiting to delegate.':'Нечего передавать.',
    'MEMBERS · DROP TO ASSIGN':'СОТРУДНИКИ · ПЕРЕТАЩИТЕ, ЧТОБЫ НАЗНАЧИТЬ','OVERLOADED':'ПЕРЕГРУЖЕН','Daily Status':'Статус дня','BY DEPARTMENT':'ПО ОТДЕЛАМ','OVERLOAD':'ПЕРЕГРУЗКА',
    'ON TRACK':'В ГРАФИКЕ','WATCH':'ВНИМАНИЕ','Efficiency':'Эффективность','Battery':'Батарея','BY PERSON':'ПО СОТРУДНИКАМ',
    'Battery = capacity left — drains green→red as tasks pile up':'Батарея = свободный ресурс: разряжается от зелёного к красному по мере роста задач',
    // goals page
    '+ New goal':'+ Новая цель','Set by':'Автор:','· 3 departments':'· 3 отдела','Simulate one step':'Один шаг симуляции','Auto-play ▸':'Автоплей ▸','Pause':'Пауза','Reset':'Сброс',
    'See tasks in Work Flow →':'Задачи в «Потоке работ» →','Goal complete — every piece is in place.':'Цель достигнута — все детали на месте.','All approved results were filed to Sync Mind.':'Все одобренные результаты переданы в Синк.',
    'Piece':'Деталь','in':'в','★ C-Level priority':'★ Приоритет C-Level','Request from another dept':'Запрос из другого отдела','Piece is in place ✓':'Деталь на месте ✓',
    'One goal, one puzzle':'Одна цель — один пазл',
    'Each piece is a task. Its color shows the department doing it. Pieces fill in as work moves forward, and the puzzle is solved when every department has delivered.':'Каждая деталь — задача, цвет показывает отдел-исполнитель. Детали заполняются по мере работы, и пазл собран, когда все отделы сдали свою часть.',
    'Tap a piece to see its task.':'Нажмите на деталь, чтобы увидеть задачу.','New goal':'Новая цель',
    'Describe the outcome. The AI splits it across departments using your org tree, roles and current workload.':'Опишите результат — AI распределит его по отделам с учётом орг-дерева, ролей и текущей загрузки.',
    'Decompose with AI ✦':'Декомпозировать с AI ✦','Decompose with AI':'Декомпозировать с AI','NEW GOAL':'НОВАЯ ЦЕЛЬ','6 tasks · 3 departments · each becomes a puzzle piece':'6 задач · 3 отдела · каждая станет деталью пазла',
    'Create goal & puzzle':'Создать цель и пазл','Open a second office in Lisbon by spring':'Открыть второй офис в Лиссабоне к весне',
    'Market positioning & messaging':'Позиционирование и сообщения','Launch campaign assets':'Материалы кампании','Feature build & integration':'Разработка и интеграция функций',
    'QA & release':'Тестирование и релиз','Pricing & packaging':'Цены и пакеты','Partner outreach':'Работа с партнёрами',
    // brainstorm
    'Brainstorms':'Брейншторм','+ New session':'+ Новая сессия','NEW SESSION · OWNER / LEADS':'НОВАЯ СЕССИЯ · ВЛАДЕЛЕЦ / ЛИДЫ','Topic or question for the team…':'Тема или вопрос для команды…',
    'Duration':'Длительность',"Who's invited":'Кто приглашён','All company':'Вся компания','Start session':'Начать сессию','LIVE ·':'ИДЁТ ·','LIVE':'ИДЁТ','CLOSED':'ЗАВЕРШЕНА','Started by':'Автор:',
    "How might we make a new customer's first week feel effortless?":'Как сделать первую неделю нового клиента лёгкой?','Names for the September launch campaign':'Названия для сентябрьской кампании запуска',
    'What slows down our release process?':'Что тормозит наши релизы?','Text only, no voting. When time is up, every idea goes to Sync Mind.':'Только текст, без голосования. Когда время выйдет, все идеи уйдут в Синк.',
    'Time left':'Осталось','Session ended':'Сессия завершена','End now':'Завершить сейчас','Add your idea — one thought per card. Press Enter to post.':'Ваша идея — одна мысль на карточку. Enter, чтобы опубликовать.',
    'Post idea':'Опубликовать','Session closed ·':'Сессия завершена ·','ideas sent to Sync Mind':'идей переданы в Синк','Ask Sync Mind to group the ideas or turn them into a goal.':'Попросите Синк сгруппировать идеи или превратить их в цель.',
    'Open Sync Mind →':'Открыть Синк →','No ideas yet — be the first.':'Идей пока нет — будьте первым.',"You're contributing as Tom Reyes · Designer":'Вы участвуете как Tom Reyes · Дизайнер',
    'Assign every new customer a named contact for week one.':'Закрепить за каждым новым клиентом личного контакта на первую неделю.',
    'Send a 60-second video recap after their first goal is decomposed.':'Присылать 60-секундное видео-резюме после декомпозиции первой цели.',
    'A welcome email that links straight to building the org tree.':'Приветственное письмо со ссылкой сразу на построение орг-дерева.',
    'Pre-fill departments from the company size they chose at signup.':'Предзаполнять отделы по размеру компании, указанному при регистрации.',
    '"In Sync" — short and on-brand.':'«In Sync» — коротко и в стиле бренда.','"One Tree, Every Team".':'«Одно дерево — все команды».','"Goals, Untangled".':'«Цели без путаницы».',
    'Manual QA sign-off waits on one person.':'Ручное подтверждение QA зависит от одного человека.','Preview environments take 20 minutes to spin up.':'Превью-окружения поднимаются 20 минут.',
    'Release notes are written at the last minute.':'Release notes пишутся в последний момент.',
    'Pre-provision a sandbox workspace with sample data on signup.':'Создавать при регистрации песочницу с примером данных.',
    'Show a 3-step checklist on the empty dashboard instead of a blank page.':'Показывать чек-лист из трёх шагов вместо пустого дашборда.',
    'Offer a kickoff call slot right inside the onboarding flow.':'Предлагать слот для стартового созвона прямо в онбординге.',
    'Celebrate the first completed task with a small team moment.':'Отмечать первую выполненную задачу небольшим командным моментом.',
    'Let admins import the org tree from a CSV in one click.':'Дать админам импортировать орг-дерево из CSV в один клик.',
    // workspace
    "Good morning. Who's working?":'Доброе утро. Кто сегодня работает?','Tap your card to open your personal workspace.':'Нажмите на свою карточку, чтобы открыть личное пространство.',
    'open tasks':'открытых задач','My Workspace':'Моё пространство','THE THREAD':'НИТЬ','Tasks slide down the line as you work them.':'Задачи спускаются по нити по мере работы.',
    'Assigned':'Назначено','in backlog':'в бэклоге','In Focus':'В фокусе','TODAY':'СЕГОДНЯ','in progress':'в работе','completed':'выполнено','For Review':'На проверку','sent to manager':'у менеджера',
    'Good morning,':'Доброе утро,',"Pick what you'll tackle today. Each task falls down the thread as it moves forward.":'Выберите, чем займётесь сегодня. Каждая задача спускается по нити по мере продвижения.',
    'Assigned to you':'Назначено вам','sorted by priority':'по приоритету','Take today':'Взять сегодня','Take today ↓':'Взять сегодня ↓','Backlog clear — every task is in motion.':'Бэклог пуст — все задачи в движении.',
    'In focus today':'В фокусе сегодня','Working now':'В работе','Mark done':'Отметить готовой','Mark done ✓':'Отметить готовой ✓','Nothing in focus yet — take a task above to start your day.':'В фокусе пока пусто — возьмите задачу выше, чтобы начать день.',
    'Done — ready to send':'Готово — можно отправлять','Send all for review ⚑':'Отправить всё на проверку ⚑','Send for review ⚑':'На проверку ⚑',
    'Completed tasks land here, ready to send up the thread.':'Сюда попадают выполненные задачи, готовые к отправке.','With your manager':'У менеджера','Awaiting review':'Ждёт проверки',
    'No result yet':'Результата нет','Assigned by':'Поставил(а)','Result':'Результат','REQUIRED':'ОБЯЗАТЕЛЬНО','Nothing attached':'Ничего не прикреплено',
    'Attach what you produced — a document, a link or an image. This is what your manager reviews.':'Прикрепите результат — документ, ссылку или изображение. Именно это проверит менеджер.',
    'Attach a result before marking this task done.':'Прикрепите результат, прежде чем отмечать задачу готовой.','Document':'Документ','Link':'Ссылка','Image':'Изображение',
    'Drop a file or':'Перетащите файл или','browse':'выберите','PDF, DOCX, XLSX, PPTX · up to 50 MB':'PDF, DOCX, XLSX, PPTX · до 50 МБ','Paste a link — Figma, Google Docs, Notion…':'Вставьте ссылку — Figma, Google Docs, Notion…',
    'Drop an image or':'Перетащите изображение или','PNG, JPG, GIF · screenshots welcome':'PNG, JPG, GIF · скриншоты тоже подойдут','Saved to Google Drive':'Сохранено в Google Drive','Open ↗':'Открыть ↗',
    'Awaiting manager review':'Ждёт проверки менеджера','Attach a result to complete this task':'Прикрепите результат, чтобы завершить задачу','synced to Drive':'в Drive','saved to Drive':'в Drive',
    // prototype canvas
    '01 — Login':'01 — Вход','02 — Onboarding':'02 — Онбординг','03 — Dashboard (Owner)':'03 — Дашборд (владелец)','04 — Assign Work (Owner)':'04 — Распределение (владелец)',
    'Your team, always in sync.':'Ваша команда — всегда в синхроне.','Set goals, decompose them with AI, and watch your team execute — visually.':'Ставьте цели, декомпозируйте их с AI и наблюдайте, как команда их выполняет — наглядно.',
    'Org Tree':'Орг-дерево','AI Decomposition':'AI-декомпозиция','Virtual Office':'Виртуальный офис','Welcome back':'С возвращением','Sign in to your SYNCO workspace':'Войдите в рабочее пространство SYNCO',
    'Continue with Google':'Продолжить с Google','or sign in with email':'или войдите по email','Password':'Пароль','Forgot password?':'Забыли пароль?','Sign in':'Войти',"Don't have an account?":'Нет аккаунта?','Request access':'Запросить доступ',
    'STEP 1 OF 3':'ШАГ 1 ИЗ 3',"Let's set up your workspace":'Настроим ваше пространство','Tell us a bit about your team to personalize SYNCO.':'Расскажите о команде, чтобы мы настроили SYNCO под вас.',
    'Workspace name':'Название пространства','Your role':'Ваша роль','Company size':'Размер компании','Select company size':'Выберите размер компании','Progress':'Прогресс','Continue':'Продолжить','Skip for now':'Пропустить',
    '10 active':'10 онлайн','Organization':'Организация','Search people, tasks, goals…':'Поиск людей, задач, целей…','Set a goal for your team':'Поставьте цель команде','AI-GENERATED TASKS':'ЗАДАЧИ ОТ AI'
  };
  Object.assign(D,{"Detected automatically":"Определено автоматически","Auto":"Авто","Change":"Изменить","Close":"Закрыть","Search city or country":"Поиск: город или страна","No matches":"Ничего не найдено"});
  Object.assign(D,{"Edit":"Изменить","+ Add meeting link":"+ Ссылка на встречу","Paste a Google Meet or Zoom link":"Вставьте ссылку Google Meet или Zoom","Save":"Сохранить","Join call ↗":"Присоединиться ↗","Meeting link saved":"Ссылка на встречу сохранена"});
  /*ADD2*/Object.assign(D,{"Home":"Главная","Office":"Офис","Settings":"Настройки","Notifications":"Уведомления","Sign in to your SYNCO workspace":"Войдите в рабочее пространство SYNCO","Password updated. Sign in with your new password.":"Пароль обновлён. Войдите с новым паролем.","DEMO · SIGN IN AS":"ДЕМО · ВОЙТИ КАК","Each role lands on its own start screen.":"Каждая роль попадает на свой стартовый экран.","Work Flow · all departments":"Поток работ · все отделы","Company overview":"Обзор компании","Marketing team":"Команда маркетинга","Got an invite?":"Есть приглашение?","Accept invite":"Принять приглашение","← Back to sign in":"← Назад ко входу","Back to sign in":"Назад ко входу","Get started":"Начать","Create a workspace for your company, or ask to join your team’s.":"Создайте пространство для компании или попроситесь в пространство своей команды.","Create a workspace for your company, or ask to join your team's.":"Создайте пространство для компании или попроситесь в пространство своей команды.","Create a workspace":"Создать пространство","Join my team":"Присоединиться к команде","Full name":"Имя и фамилия","Work email":"Рабочий email","At least 8 characters":"Минимум 8 символов","Company name":"Название компании","Create workspace →":"Создать пространство →","Workspace":"Пространство","Company name or domain":"Название компании или домен","REGAGRO · 10 people on SYNCO":"REGAGRO · 10 человек в SYNCO","Note for the admin":"Комментарий для администратора","· optional":"· необязательно","I'm joining the Marketing team as a designer.":"Я присоединяюсь к маркетингу как дизайнер.","By continuing you agree to the":"Продолжая, вы принимаете","Terms":"Условия","and":"и","Privacy Policy":"Политику конфиденциальности","Request sent":"Запрос отправлен","We've let the REGAGRO admins know. You'll get an email at":"Мы уведомили администраторов REGAGRO. Письмо придёт на","as soon as they approve.":"сразу после одобрения.","WHAT HAPPENS NEXT":"ЧТО ДАЛЬШЕ","An admin reviews your request and places you in a department.":"Администратор рассмотрит запрос и добавит вас в отдел.","You receive an invite link by email.":"Вы получите ссылку-приглашение по почте.","You set up your profile and land in your workspace.":"Вы заполните профиль и попадёте в своё пространство.","Demo: admin approved — open the invite →":"Демо: администратор одобрил — открыть приглашение →","Reset your password":"Восстановление пароля","Enter the email you use for SYNCO and we'll send you a link to choose a new password.":"Введите email, который вы используете в SYNCO, — пришлём ссылку для нового пароля.","Send reset link":"Отправить ссылку","Check your inbox":"Проверьте почту","We sent a reset link to":"Мы отправили ссылку на",". It expires in 30 minutes.":". Она действует 30 минут.","Resend link":"Отправить ещё раз","No email? Check spam, or":"Письма нет? Проверьте спам или","use a different address":"укажите другой адрес","Demo: open the reset link →":"Демо: открыть ссылку из письма →","Choose a new password":"Придумайте новый пароль","For":"Для","New password":"Новый пароль","Contains a number":"Есть цифра","Upper and lower case letters":"Строчные и заглавные буквы","Confirm password":"Повторите пароль","Passwords don't match":"Пароли не совпадают","Save and sign in":"Сохранить и войти","Weak":"Слабый","Fair":"Средний","Good":"Хороший","Strong":"Надёжный","Olga White invited you to join":"Olga White приглашает вас в","Department":"Отдел","Position":"Должность","Access":"Доступ","Invite expires in 6 days":"Приглашение действует ещё 6 дней","or set a password":"или задайте пароль","Accept & join REGAGRO":"Принять и войти в REGAGRO","Workspace setup":"Настройка пространства","Joining REGAGRO":"Вход в REGAGRO","STEP 2 OF 3":"ШАГ 2 ИЗ 3","STEP 3 OF 3":"ШАГ 3 ИЗ 3","Map your organization":"Опишите структуру компании","Add departments and who leads them. You can refine everything later in the Org Tree editor.":"Добавьте отделы и их руководителей. Всё можно уточнить позже в редакторе орг-дерева.","Marketing, Development, Sales":"Маркетинг, Разработка, Продажи","Use":"Применить","DEPARTMENT":"ОТДЕЛ","TEAM LEAD EMAIL":"EMAIL ТИМЛИДА","+ Add department":"+ Добавить отдел","Import CSV":"Импорт CSV","CSV format: one department per line —":"Формат CSV: один отдел в строке —","Department, lead email":"Отдел, email лида","LIVE PREVIEW":"ПРЕДПРОСМОТР","You · Owner":"Вы · владелец","No lead yet":"Лид не назначен","Untitled":"Без названия","Back":"Назад","Invite your team":"Пригласите команду","Pick a department and access level for each person. Click a pill to change it.":"Выберите отдел и уровень доступа для каждого. Нажмите на метку, чтобы изменить.","name@regagro.com — press Enter to add":"name@regagro.com — Enter, чтобы добавить","Or share an invite link":"Или поделитесь ссылкой","Copy link":"Копировать","Copied ✓":"Скопировано ✓","People who join by link start as Members. You place them in a department afterwards.":"Вошедшие по ссылке получают роль Member — отдел назначите позже.","I'll invite people later":"Приглашу позже","Finish setup":"Завершить настройку","is ready":"готово","Your org tree is live and invites are on their way.":"Орг-дерево создано, приглашения отправлены.","departments":"отдела","invites sent":"приглашений","your role":"ваша роль","Set your first goal":"Поставьте первую цель","Describe an outcome — the AI splits it across your departments.":"Опишите результат — AI распределит его по отделам.","Set first goal →":"Поставить первую цель →","Explore the Work Flow first":"Сначала посмотреть поток работ","Welcome to REGAGRO,":"Добро пожаловать в REGAGRO,","Olga White added you to the Marketing team. Here's who you'll work with.":"Olga White добавила вас в команду маркетинга. Вот с кем вы будете работать.","4 people · part of 3 active goals":"4 человека · участвуют в 3 целях","YOUR TEAM LEAD":"ВАШ ТИМЛИД","Your position":"Ваша должность","Access level":"Уровень доступа","Set up your profile":"Заполните профиль","Your teammates see this in the org tree and the Virtual Office.":"Коллеги увидят это в орг-дереве и виртуальном офисе.","Profile photo":"Фото профиля","Click to upload · PNG or JPG":"Нажмите, чтобы загрузить · PNG или JPG","Time zone":"Часовой пояс","Working hours":"Рабочие часы","Flexible":"Гибкий график","How work moves in SYNCO":"Как устроена работа в SYNCO","Three things to know before your first day.":"Три вещи, которые стоит знать до первого дня.","1 · The Thread":"1 · Нить","Each morning, pick the tasks you'll take today. They move down the thread: in focus → done → review.":"Каждое утро выбирайте задачи на день. Они спускаются по нити: в фокусе → готово → проверка.","2 · Attach a result":"2 · Прикрепите результат","A task is done when you attach a doc, link or image. Your Team Lead reviews it, and it's saved to Drive.":"Задача готова, когда прикреплён документ, ссылка или изображение. Тимлид проверит, а файл сохранится в Drive.","3 · Your piece of the goal":"3 · Ваша деталь цели","Every task is one piece of a company goal. When all departments deliver, the puzzle is solved.":"Каждая задача — деталь цели компании. Когда все отделы сдают свои части, пазл собран.","Open my workspace →":"Открыть моё пространство →","DEMO · VIEW AS":"ДЕМО · ВИД","Good morning, Vera":"Доброе утро, Vera","COO · C-Level · oversees Marketing, Development and Sales":"COO · C-Level · курирует Маркетинг, Разработку и Продажи","★ New priority request":"★ Новый приоритетный запрос","Goals on track":"Цели в графике","G2 · EMEA needs attention":"G2 · EMEA требует внимания","Waiting for your review":"Ждут вашей проверки","final sign-off on your tasks":"финальное согласование ваших задач","Overloaded people":"Перегружены","Sam Park · Development":"Sam Park · Разработка","Your open priority requests":"Ваши открытые приоритетные запросы","waiting on department leads":"ждут решения лидов","Company goals":"Цели компании","Open puzzles →":"Открыть пазлы →","On track":"В графике","At risk":"Под угрозой","· bar = pieces done by each department":"· полоса = детали, сделанные каждым отделом","Departments today":"Отделы сегодня","LEAD":"ЛИД","IN REVIEW":"НА ПРОВЕРКЕ","STATUS":"СТАТУС","Needs your sign-off":"Нужно ваше согласование","Tasks you set. Team Leads have already approved them.":"Задачи, которые вы поставили. Тимлиды их уже одобрили.","Return":"Вернуть","What needs to change?":"Что нужно изменить?","Send back for revision":"Вернуть на доработку","All signed off. Nothing waiting on you.":"Всё согласовано. Ничего не ждёт вашего решения.","Your priority requests":"Ваши приоритетные запросы","WAITING":"ЖДЁТ","Marketing Team":"Команда маркетинга","YOU LEAD THIS TEAM":"ВЫ РУКОВОДИТЕ КОМАНДОЙ","Jane Smith · Content Lead · 3 members":"Jane Smith · контент-лид · 3 участника","Team efficiency":"Эффективность команды","Team battery":"Батарея команды","Review queue":"Очередь проверки","Your approval completes this task":"Ваше одобрение завершает задачу","After you: final review by Vera Kova (C-Level)":"После вас: финальная проверка Vera Kova (C-Level)","Send back":"Вернуть","Queue is clear.":"Очередь пуста.","Incoming requests":"Входящие запросы","Accept":"Принять","✓ Accepted — added to your desk":"✓ Принято — добавлено на ваш стол","Declined — sender notified":"Отклонено — отправитель уведомлён","Team today":"Команда сегодня","Virtual Office →":"Виртуальный офис →","IN FOCUS NOW":"СЕЙЧАС В ФОКУСЕ","JOINED 2 DAYS AGO":"ПРИСОЕДИНИЛАСЬ 2 ДНЯ НАЗАД","Finishing onboarding — no tasks yet":"Проходит онбординг — задач пока нет","Available":"На связи","Onboarding":"Онбординг","Designer · new":"Дизайнер · новенькая","On your desk":"На вашем столе","From Owner and C-Level. Pick who does it.":"От владельца и C-Level. Выберите исполнителя.","Marketing’s pieces":"Детали маркетинга","Marketing's pieces":"Детали маркетинга","Goals →":"Цели →","Settings /":"Настройки /","Org Tree":"Орг-дерево","All changes saved":"Все изменения сохранены","Find a person":"Найти сотрудника","+ Person":"+ Сотрудник","+ Department":"+ Отдел","+ Add person":"+ Добавить","INVITED":"ПРИГЛАШЁН","Team Lead of":"Тимлид отдела","Reviews the team’s work and delegates tasks":"Проверяет работу команды и распределяет задачи","Reviews the team's work and delegates tasks":"Проверяет работу команды и распределяет задачи","Sees every department, sends priority requests, gives final sign-off.":"Видит все отделы, отправляет приоритетные запросы, даёт финальное согласование.","Runs one department: delegates, reviews, accepts requests.":"Ведёт один отдел: распределяет, проверяет, принимает запросы.","Works their own thread and attaches results for review.":"Работает в своей нити и прикрепляет результаты на проверку.","Invite sent 2 days ago — not accepted yet.":"Приглашение отправлено 2 дня назад — пока не принято.","Resend":"Отправить снова","Sent ✓":"Отправлено ✓","Remove from workspace":"Удалить из пространства","Color":"Цвет","Add people to choose a lead.":"Добавьте людей, чтобы выбрать лида.","Delete department":"Удалить отдел","Move everyone to another department first.":"Сначала переведите всех в другой отдел.","Edit your structure":"Редактируйте структуру","Changes save instantly and update everyone's permissions, review chains and AI decomposition.":"Изменения сохраняются сразу и обновляют права, цепочки проверки и AI-декомпозицию.","Drag a person onto another department to move them.":"Перетащите человека в другой отдел, чтобы перевести.","Click a person or department to edit it here.":"Нажмите на человека или отдел, чтобы отредактировать.","Making someone Team Lead hands them the review queue.":"Назначенный тимлидом получает очередь проверки.","people":"человек","invited":"приглашены","New person":"Новый сотрудник","New department":"Новый отдел","Profile":"Профиль","Members & roles":"Участники и роли","Roles & permissions":"Роли и права","Integrations":"Интеграции","Signed in as Olga White · Owner":"Вы вошли как Olga White · владелец","How teammates see you across SYNCO.":"Как вас видят коллеги в SYNCO.","Email":"Email","Interface language":"Язык интерфейса","Save changes":"Сохранить","Changes saved":"Изменения сохранены","Settings that apply to everyone in REGAGRO.":"Настройки для всех в REGAGRO.","Workspace name":"Название пространства","Address":"Адрес","Auto-approve people from @regagro.com":"Автоматически одобрять людей с @regagro.com","They join as Members without waiting for an admin.":"Они входят как Member, не дожидаясь администратора.","Task capacity per person":"Ёмкость задач на человека","A full battery equals this many open tasks. Used for overload warnings and AI suggestions.":"Полная батарея — столько открытых задач. Используется для предупреждений о перегрузке и подсказок AI.","Default brainstorm length":"Длительность брейншторма по умолчанию","Can be changed when a session starts.":"Можно изменить при запуске сессии.","Click a role to change it. Departments are managed in the Org Tree.":"Нажмите на роль, чтобы изменить её. Отделы настраиваются в орг-дереве.","Edit Org Tree →":"Редактировать орг-дерево →","Invite by email — name@regagro.com":"Пригласить по email — name@regagro.com","Send invite":"Пригласить","PERSON":"СОТРУДНИК","ROLE":"РОЛЬ","Active":"Активен","Invited":"Приглашён","What each access level can do. Changes apply immediately to everyone with that role.":"Что может каждый уровень доступа. Изменения сразу применяются ко всем с этой ролью.","ACTION":"ДЕЙСТВИЕ","Set company goals":"Ставить цели компании","Create goals and decompose them with AI":"Создавать цели и декомпозировать их с AI","Assign to departments":"Назначать отделам","Hand tasks to Team Leads":"Передавать задачи тимлидам","Assign to members directly":"Назначать сотрудникам напрямую","Skip the Team Lead":"Минуя тимлида","Send priority requests":"Отправлять приоритетные запросы","Jump ahead in another team’s queue":"Вне очереди другой команды","Send regular requests":"Отправлять обычные запросы","Ask another department for help":"Просить помощи у другого отдела","Review & approve results":"Проверять и одобрять результаты","Approve or return work":"Одобрять или возвращать работу","Edit the org tree":"Редактировать орг-дерево","Move people, create departments":"Переводить людей, создавать отделы","Start a brainstorm":"Запускать брейншторм","Open a timed idea session":"Открывать сессию идей с таймером","Ask Sync Mind":"Спрашивать Синк","Search and compile approved docs":"Искать и собирать одобренные документы","Manage integrations & billing":"Управлять интеграциями и оплатой","Drive, Slack, payment":"Drive, Slack, оплата","The Owner always has full access.":"У владельца всегда полный доступ.","Connect the tools your team already uses.":"Подключите инструменты, которыми команда уже пользуется.","Connected":"Подключено","Not connected":"Не подключено","Connecting…":"Подключение…","Connect":"Подключить","Disconnect":"Отключить","Folder structure":"Структура папок","Save every attached result automatically":"Автоматически сохранять каждый результат","Every attached result is saved to the task’s folder.":"Каждый прикреплённый результат сохраняется в папку задачи.","Deadlines and brainstorm sessions appear in your calendar.":"Дедлайны и брейнштормы появляются в календаре.","Get review requests and mentions in Slack.":"Запросы на проверку и упоминания — в Slack.","Let Sync Mind read approved Notion pages.":"Синк сможет читать одобренные страницы Notion.","Choose what reaches you, and where.":"Выберите, что и куда вам приходит.","Open inbox →":"Открыть уведомления →","EVENT":"СОБЫТИЕ","In-app":"В приложении","A task is assigned to me":"Мне назначили задачу","A result needs my review":"Результат ждёт моей проверки","My task is returned for revision":"Мою задачу вернули на доработку","A new request for my team":"Новый запрос для моей команды","My request is accepted or declined":"Мой запрос приняли или отклонили","Someone mentions me":"Меня упомянули","A brainstorm starts":"Начался брейншторм","A goal is completed":"Цель достигнута","Daily digest":"Ежедневная сводка","One email with yesterday's progress, overloads and open reviews.":"Одно письмо: прогресс за вчера, перегрузки и открытые проверки.","Off":"Выкл","Connect Slack in Integrations first":"Сначала подключите Slack в интеграциях","new":"новых","Jane Smith · Team Lead, Marketing":"Jane Smith · тимлид, маркетинг","Mark all as read":"Отметить всё прочитанным","Preferences":"Настройки","All":"Все","Unread":"Непрочитанные","Reviews":"Проверки","Mentions":"Упоминания","TODAY":"СЕГОДНЯ","EARLIER":"РАНЕЕ","sent for your review":"отправил на вашу проверку","from Sales requested":"из продаж запрашивает","sent a priority request":"отправила приоритетный запрос","mentioned you in":"упомянула вас в","is now":"теперь","50% complete":"выполнена на 50%","started a brainstorm":"запустила брейншторм","declined your request":"отклонили ваш запрос","saved":"сохранил","accepted your invite and joined":"приняла приглашение и вошла в","@Jane can you double-check the posting times for the EMEA audience?":"@Jane, проверишь время публикаций для аудитории EMEA?","View puzzle":"Открыть пазл","Join":"Присоединиться","Open in Drive":"Открыть в Drive","View in Org Tree":"Показать в орг-дереве","Open":"Открыть","Approved · filed to Sync Mind":"Одобрено · передано в Синк","Accepted · on your desk":"Принято · на вашем столе","Declined · Omar was notified":"Отклонено · Omar уведомлён","You're all caught up.":"Вы всё прочитали.","Yesterday":"Вчера","12 min ago":"12 мин назад","40 min ago":"40 мин назад","1 h ago":"1 ч назад","2 h ago":"2 ч назад","3 h ago":"3 ч назад","2 days ago":"2 дня назад","Product screenshots for the sales deck":"Скриншоты продукта для презентации продаж","Q3 messaging guide":"Гайд по сообщениям на III квартал","Google Drive":"Google Drive","You're Tom Reyes · Designer":"Вы — Tom Reyes · дизайнер","REGAGRO HQ":"Офис REGAGRO","My status":"Мой статус","In focus":"В фокусе","In a meeting":"На встрече","Away":"Нет на месте","Brainstorm live now":"Брейншторм идёт сейчас","Join →":"Присоединиться →","ON A CALL":"СОЗВОН","Team room · Jane’s team":"Комната команды · команда Jane","Team room · Alex’s team":"Комната команды · команда Alex","Team room · Omar’s team":"Комната команды · команда Omar","Launch war room":"Штаб запуска","Meeting room · G1 · Launch":"Переговорная · G1 · Запуск","Focus zone":"Зона фокуса","Quiet · knocks are held until later":"Тишина · стук доставят позже","Lounge":"Лаунж","Coffee, small talk, random hellos":"Кофе, болтовня, случайные встречи","You":"Вы","YOU":"ВЫ","Empty right now":"Сейчас пусто","Join call":"Присоединиться к созвону","Go focus":"Уйти в фокус","Move here":"Перейти сюда","You're here":"Вы здесь","Mute":"Выкл. микрофон","Unmute":"Вкл. микрофон","Camera on":"Вкл. камеру","Camera off":"Выкл. камеру","Leave":"Выйти","Room":"Комната","Working on":"Работает над","Local time":"Местное время","In focus — a knock is delivered quietly and shown when they come back.":"В фокусе — стук доставят тихо и покажут, когда человек освободится.","Knock":"Постучать","Knocked ✓":"Постучали ✓","Same room":"В этой комнате","Who's around":"Кто на месте","Leadership":"Руководство","audio only":"только аудио","camera on":"камера включена","Sprint planning":"Планирование спринта","Demo with a design partner":"Демо для дизайн-партнёра","Launch go/no-go review":"Решение о запуске","Back at 15:00":"Вернусь в 15:00","Reviewing the social calendar":"Проверяет контент-план"});
  var P=[
    [/^Open in (.+) ↗$/,'Открыть в $1 ↗'],
    [/^now (\d\d:\d\d)$/,'сейчас $1'],
    [/^Welcome to REGAGRO, (.+)$/,'Добро пожаловать в REGAGRO, $1'],
    [/^(.+) is ready$/,'$1 готово'],
    [/^Send (\d+) invites$/,'Отправить приглашений: $1'],
    [/^Team Lead of (.+)$/,function(m,a){return 'Тимлид отдела «'+(tr(a)||a)+'»';}],
    [/^Saved (\d+) min ago$/,'Сохранено $1 мин назад'],
    [/^(\d+) (person|people)$/,'$1 чел.'],
    [/^(\d+) here$/,'$1 здесь'],
    [/^(\d+) of (\d+) online · (\d+) calls in progress$/,'$1 из $2 онлайн · созвонов: $3'],
    [/^On a call in (.+)$/,function(m,a){return 'Созвон: '+(tr(a)||a);}],
    [/^Go to (.+)$/,function(m,a){return 'Перейти: '+(tr(a)||a);}],
    [/^You moved to (.+)$/,function(m,a){return 'Вы перешли: '+(tr(a)||a);}],
    [/^Click again to remove (.+)$/,'Нажмите ещё раз, чтобы удалить: $1'],
    [/^Resend link in (0:\d+)$/,'Отправить снова через $1'],
    [/^Stage 1 approved by (.+)$/,'Этап 1 одобрен: $1'],
    [/^Delegated to (.+) · moved to their thread$/,'Передано: $1 · в их нити'],
    [/^To (\w+) · (.+)$/,function(m,a,b){return 'В '+(tr(a)||a)+' · '+(tr(b)||b);}],
    [/^From (.+)$/,function(m,a){return 'От: '+a;}],
    [/^(\d+) of (\d+) done$/,'$1 из $2 готово'],
    [/^(\d+)\/(\d+) tasks$/,'$1/$2 задач'],
    [/^(\d+(?:\.\d+)?) left$/,'осталось $1'],
    [/^(\d+) min$/,'$1 мин'],
    [/^Invite sent to (.+)$/,'Приглашение отправлено: $1'],
    [/^(.+) removed from workspace$/,'$1 удалён(а) из пространства'],
    [/^(.+) connected$/,'$1 подключено'],
    [/^Connected · (.+)$/,'Подключено · $1'],
    [/^(\d+) of (\d+) pieces · due (.+)$/,'$1 из $2 деталей · срок $3'],

    [/^(\d+)h ago$/,'$1 ч назад'],[/^(\d+)m ago$/,'$1 мин назад'],[/^(\d+)d ago$/,'$1 дн назад'],
    [/^(\d+)h (\d+)m$/,'$1 ч $2 мин'],[/^(\d+) min$/,'$1 мин'],[/^(\d+(?:\.\d+)?) KB$/,'$1 КБ'],[/^(\d+(?:\.\d+)?) MB$/,'$1 МБ'],
    [/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d+), (\d{4})$/,function(m,a,b,c){return b+' '+MON[a]+' '+c;}],
    [/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d+)$/,function(m,a,b){return b+' '+MON[a];}],
    [/^Due (\w{3}) (\d+)$/,function(m,a,b){return 'Срок: '+b+' '+(MON[a]||a);}],
    [/^Suggested (\w{3}) (\d+)$/,function(m,a,b){return 'Предложено: '+b+' '+(MON[a]||a);}],
    [/^Request · (.+)$/,function(m,a){return 'Запрос · '+(tr(a)||a);}],
    [/^Reviewer · (.+)$/,function(m,a){return 'Проверяющий · '+(tr(a)||a);}],
    [/^TEAM LEAD, (\w+)$/,function(m,a){return 'ТИМЛИД, '+(UP[a]||a);}],
    [/^(\d+) tasks$/,'$1 задач'],[/^(\d+) members$/,'$1 участн.'],[/^(\d+) ideas$/,'$1 идей'],[/^(\d+) docs$/,'$1 док.'],
    [/^(\d+) approved docs indexed$/,'$1 одобренных документов в базе'],[/^(\d+) attached$/,'$1 прикреплено'],[/^(\d+) results?$/,'Результатов: $1'],
    [/^(\d+) of (\d+) pieces placed$/,'$1 из $2 на месте'],[/^(\d+) of (\d+) placed · (\d+) in review$/,'$1 из $2 на месте · $3 на проверке'],
    [/^(\d+) of (\d+) have shared an idea$/,'$1 из $2 поделились идеей'],
    [/^✦ AI decomposed · (\d+) tasks$/,'✦ Декомпозировано AI · $1 задач'],
    [/^Lightest load in (\w+)$/,function(m,a){return 'Меньше всех загружен · '+(tr(a)||a);}],
    [/^by (\w{3}) (\d+)$/,function(m,a,b){return 'до '+b+' '+(MON[a]||a);}],
    [/^⚠ May push (.+) over capacity$/,'⚠ Может перегрузить: $1'],
    [/^Move to (.+)$/,function(m,a){return 'Перевести: '+(tr(a)||a);}],
    [/^Stage 1 of 2 · then (.+)$/,'Этап 1 из 2 · затем $1'],
    [/^Final review · your team requested this from (.+)$/,function(m,a){return 'Финальная проверка · ваша команда запросила это у отдела «'+(tr(a)||a)+'»';}],
    [/^added to (\w+) To Do$/,function(m,a){return 'добавлено в «К выполнению» · '+(tr(a)||a);}],
    [/^“(.+)” — (.+)$/,function(m,a,b){return '«'+(tr(a)||a)+'» — '+b;}],
    [/^Requested by (.+?) \((.+)\)\. Accepted by (.+) — assign it to a team member to start\.$/,function(m,a,b,c){return 'Запрос от '+a+' ('+(tr(b)||b)+'). Принял(а) '+c+' — назначьте исполнителя, чтобы начать.';}],
    [/^Assembled (\d+) approved documents.*$/,'Собрано $1 одобренных документа из Маркетинга, Разработки и Продаж по вашему запросу — без дублей, по этапам запуска.'],
    [/^Department · (\d+) people$/,'Отдел · $1 чел.']
  ];
  function tr(s){
    var k=s.replace(/\s+/g,' ').trim(); if(!k) return null;
    if(Object.prototype.hasOwnProperty.call(D,k)) return D[k];
    for(var i=0;i<P.length;i++){ if(P[i][0].test(k)) return k.replace(P[i][0],P[i][1]); }
    var seps=[' · ',' → '];
    for(var j=0;j<seps.length;j++){
      if(k.indexOf(seps[j])>-1){ var parts=k.split(seps[j]), ch=false;
        parts=parts.map(function(p){ var r=tr(p); if(r!=null){ch=true;return r;} return p; });
        if(ch) return parts.join(seps[j]); }
    }
    return null;
  }
  function doText(n){
    var cur=n.nodeValue;
    if(n.__ru!=null&&cur===n.__ru){ if(lang==='en'){ n.nodeValue=n.__en; } return; }
    n.__en=cur; n.__ru=null;
    if(lang!=='ru') return;
    var r=tr(cur); if(r==null) return;
    var lead=cur.match(/^\s*/)[0], trail=cur.match(/\s*$/)[0];
    n.__ru=lead+r+trail; n.nodeValue=n.__ru;
  }
  function doAttr(el,a){
    if(!el.hasAttribute(a)) return;
    var cur=el.getAttribute(a), st=el['__'+a]||(el['__'+a]={});
    if(st.ru!=null&&cur===st.ru){ if(lang==='en') el.setAttribute(a,st.en); return; }
    st.en=cur; st.ru=null; if(lang!=='ru') return;
    var r=tr(cur); if(r!=null){ st.ru=r; el.setAttribute(a,r); }
  }
  function doValue(el){
    if(lang!=='ru'||el.__vdone) return;
    var r=tr(el.value||''); el.__vdone=true; if(r==null) return;
    var proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto,'value').set.call(el,r);
    el.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function walk(root){
    if(!root) return;
    if(root.nodeType===3){ doText(root); return; }
    if(root.nodeType!==1) return;
    var tag=root.tagName; if(tag==='SCRIPT'||tag==='STYLE'||root.hasAttribute('data-lang-ui')) return;
    doAttr(root,'placeholder'); doAttr(root,'title');
    if(tag==='INPUT'||tag==='TEXTAREA') doValue(root);
    for(var c=root.firstChild;c;c=c.nextSibling) walk(c);
  }
  function btn(l){
    var on=lang===l;
    return '<button data-l="'+l+'" style="border:none;cursor:pointer;padding:5px 9px;border-radius:7px;font:700 11px Inter,system-ui,sans-serif;letter-spacing:.3px;'+(on?'background:#fff;color:#0F1B2D;box-shadow:0 1px 3px rgba(15,27,45,.12)':'background:transparent;color:#6B7385')+'">'+l.toUpperCase()+'</button>';
  }
  function paint(el){
    el.setAttribute('data-lang-ui','1');
    el.innerHTML='<div style="display:flex;gap:2px;background:#F2F3F9;border-radius:9px;padding:3px">'+btn('en')+btn('ru')+'</div>';
    el.onclick=function(e){ var b=e.target.closest('[data-l]'); if(!b) return; setLang(b.getAttribute('data-l')); };
  }
  function ensureToggle(){
    if(!document.body) return;
    var fl=document.getElementById('synco-lang-float');
    if(!fl){ fl=document.createElement('div'); fl.id='synco-lang-float'; fl.style.cssText='position:fixed;right:16px;bottom:16px;z-index:9999;background:#fff;border-radius:12px;padding:4px;box-shadow:0 6px 20px rgba(15,27,45,.18)'; document.body.appendChild(fl); }
    if(fl.__lang!==lang){ fl.__lang=lang; paint(fl); }
  }
  function setLang(l){
    lang=l; localStorage.setItem(KEY,l); document.documentElement.lang=l;
    document.querySelectorAll('input,textarea').forEach(function(el){ el.__vdone=false; });
    walk(document.body); ensureToggle();
  }
  function init(){
    document.documentElement.lang=lang;
    walk(document.body); ensureToggle();
    new MutationObserver(function(ms){
      ms.forEach(function(m){
        if(m.target&&m.target.closest&&m.target.closest('#synco-lang-float')) return;
        if(m.type==='characterData') doText(m.target);
        else if(m.type==='attributes') { if(m.attributeName==='placeholder'||m.attributeName==='title') doAttr(m.target,m.attributeName); }
        else m.addedNodes.forEach(walk);
      });
    }).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','title']});
  }
  function start(){ setTimeout(init,150); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
