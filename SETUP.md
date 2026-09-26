# Рабочее место: современная и ретро-ветка

Курс запускает Java-программы **на твоей машине**, сайт лишь хранит теорию, черновики и мини-экзамены. Версии ниже — ориентиры для выбора **исторических** совместимых сборок. Современный пакет с тем же номером JDK не обязан запускаться на старой ОС.

| Система | Стартовый JDK | Среда / проверка | Ограничение |
| --- | --- | --- | --- |
| Windows 10/11 x64 | Temurin 25 LTS, допустим 21 LTS | Современная IntelliJ IDEA Community, PowerShell | Сверь `java` и `javac` после установки |
| Windows 7 | Исторический JDK 8 для нужной архитектуры | Старая совместимая IDE или редактор + cmd | Нынешние JDK и IDE на Win7 не рассчитаны |
| Windows XP | Исторический JDK 6 x86 | Редактор + cmd, запуск из `bin` при необходимости | Глава 0–5 по синтаксису, CI работает на современной ОС |
| Linux x86_64 | JDK 21 из пакетов дистрибутива или Temurin 25 | Терминал, IntelliJ Community или редактор | Пакеты отличаются между дистрибутивами |
| Mac OS X 10.5.8 Leopard Intel | Apple Java после Update 10; на 64-битном Intel проверь Java 6 и `javac` | Terminal + редактор/Xcode своего времени | На конкретной машине может быть только более старая Java |
| Mac OS X 10.6 Intel | Apple Java 6 (обновление Apple) | Terminal, редактор/Xcode эпохи системы | Только базовые главы 0–5; остальное собирать на новой JVM |
| Mac OS X 10.7.3+ Intel | Исторический Oracle JDK 7 | Terminal + совместимая редакция IDE | JDK 7 не содержит Stream API |
| OS X 10.8+ Intel | Исторический JDK 8, проверенный под точную версию OS X | Terminal + совместимая редакция IDE | Свежие Temurin 8 для старой ОС уже не подходят |
| Современная macOS Apple Silicon | Temurin 25 LTS aarch64, допустим 21 LTS | IntelliJ Community для Apple Silicon + Terminal | Выбери arm64, проверь `/usr/libexec/java_home -V` |

## Первые команды

После установки JDK открой **новый** терминал. Проверь:

```text
java -version
javac -version
```

Windows: `where java` и `where javac`. Linux: `command -v java` и `command -v javac`. Mac: `/usr/libexec/java_home -V`.

Собери пример из корня клонированного репозитория:

```text
javac -encoding UTF-8 examples/Hello.java
java -cp examples Hello
```

Ожидаемый вывод: `JAVA_READY`. На старой Java 6 можно решать начальные лабораторные отдельно, например:

```text
javac -encoding UTF-8 work/ch00/HelloEnvironment.java
java -cp work/ch00 HelloEnvironment
```

Полный `scripts/check.sh` / `scripts/check.ps1` требует **JDK 8+**, а CI проверяет на JDK 21 с целевым Java 8. Первые работы написаны с учётом синтаксиса Java 6, но автоматическая проверка **не доказывает** их совместимость с реальной Apple Java 6 или Windows XP: для этого нужен запуск на той машине.

## Выбор старого JDK

- Apple: [Java for Mac OS X 10.5 Update 10](https://support.apple.com/en-ie/104178) и [Java for Mac OS X 10.6 Update 17](https://support.apple.com/en-ca/106567). Проверяй **обе** команды: `java` и `javac`.
- Oracle: [JDK 7 на Mac OS X требует 10.7.3+](https://docs.oracle.com/javase/7/docs/webnotes/install/mac/mac-jdk.html). [Java 8 на Mac](https://docs.oracle.com/javase/8/docs/technotes/guides/install/mac_jdk.html). Совместимость отдельного обновления может меняться.
- [Исторические системные требования JDK 7 на Windows](https://docs.oracle.com/javase/7/docs/webnotes/install/windows/windows-system-requirements.html) и [историческая документация IntelliJ IDEA 2016.2](https://resources.jetbrains.com/storage/products/help/data/idea/2016.2/intellij-idea-help.pdf). Для XP лучше простой редактор и подходящий JDK 6, без угадывания, запустится ли IDE.
- [Temurin: установка](https://adoptium.net/installation), [поддерживаемые платформы](https://adoptium.net/supported-platforms/), [разъяснение о прекращении поддержки старых macOS в свежем Temurin 8](https://adoptium.net/news/2026/02/eclipse-temurin-8u482-11030-17018-21010-2502-available).

Не ставь архивный установщик с непроверенного зеркала только потому, что он обещает совместимость. Исходники главы можно редактировать на ретро-машине, а сложные задания коммитить и проверять в CI на современной JVM.
