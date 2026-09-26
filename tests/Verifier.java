import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Contract tests for submitted labs. Run one chapter at a time. Java 8 source compatible. */
public class Verifier {
    private interface Action { void run() throws Exception; }

    private static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }

    private static void throwsType(Class<? extends Throwable> expected, Action action, String message) throws Exception {
        try { action.run(); }
        catch (Throwable error) {
            if (expected.isInstance(error)) return;
            throw new AssertionError(message + ": expected " + expected.getSimpleName() + ", got " + error, error);
        }
        throw new AssertionError(message + ": expected " + expected.getSimpleName());
    }

    private static String output(Action action) throws Exception {
        PrintStream old = System.out;
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        PrintStream stream = new PrintStream(bytes, true, "UTF-8");
        try { System.setOut(stream); action.run(); }
        finally { System.setOut(old); stream.close(); }
        return new String(bytes.toByteArray(), StandardCharsets.UTF_8).replace("\r", "").trim();
    }

    private static void chapter00() throws Exception {
        check("JAVA_READY".equals(output(() -> HelloEnvironment.main(new String[0]))), "Expected exactly JAVA_READY");
    }

    private static void chapter01() throws Exception {
        String[] lines = output(() -> RuntimeCard.main(new String[0])).split("\n");
        check(lines.length == 2, "Expected exactly two lines");
        check(lines[0].equals("JAVA=" + System.getProperty("java.version")), "Java version must come from the JVM");
        check(lines[1].equals("OS=" + System.getProperty("os.name")), "OS name must come from the JVM");
    }

    private static void chapter02() {
        check(TicketPrice.price(-1, true) == -1, "Negative age");
        check(TicketPrice.price(0, false) == 0 && TicketPrice.price(6, true) == 0, "Under 7");
        check(TicketPrice.price(7, false) == 50 && TicketPrice.price(17, true) == 50, "Age 7 to 17");
        check(TicketPrice.price(18, true) == 80 && TicketPrice.price(18, false) == 100, "Adult boundary");
        check(TicketPrice.price(120, true) == 80, "Older student");
    }

    private static void chapter03() throws Exception {
        check(NumberStats.sum(new int[0]) == 0, "Empty sum");
        check(NumberStats.sum(new int[] {3, -4, 7}) == 6, "Mixed sum");
        check(NumberStats.max(new int[] {-9, -3, -8}) == -3, "Negative-only maximum");
        check(NumberStats.max(new int[] {4, 4, 2}) == 4, "Duplicate maximum");
        throwsType(IllegalArgumentException.class, () -> NumberStats.max(new int[0]), "Empty maximum");
    }

    private static void chapter04() throws Exception {
        throwsType(IllegalArgumentException.class, () -> new BankAccount(-1), "Negative initial balance");
        BankAccount first = new BankAccount(20);
        BankAccount second = new BankAccount(5);
        check(first.getBalance() == 20 && second.getBalance() == 5, "Independent accounts");
        first.deposit(10);
        check(first.getBalance() == 30 && second.getBalance() == 5, "Deposit must change only one account");
        check(!first.withdraw(31) && first.getBalance() == 30, "Overdraft must leave state unchanged");
        check(first.withdraw(30) && first.getBalance() == 0, "Exact withdrawal");
        throwsType(IllegalArgumentException.class, () -> first.deposit(0), "Zero deposit");
        throwsType(IllegalArgumentException.class, () -> first.withdraw(-1), "Negative withdrawal");
        check(first.getBalance() == 0, "Invalid operation must not mutate balance");
    }

    private static void chapter05() {
        List<String> input = new ArrayList<String>(Arrays.asList("Ada", "Ada", "ada", ""));
        Map<String, Integer> result = Frequency.count(input);
        check(result.size() == 3, "Exact case and empty keys");
        check(Integer.valueOf(2).equals(result.get("Ada")), "Duplicate count");
        check(Integer.valueOf(1).equals(result.get("ada")) && Integer.valueOf(1).equals(result.get("")), "Distinct keys");
        check(input.equals(Arrays.asList("Ada", "Ada", "ada", "")), "Input must be unchanged");
        check(Frequency.count(Collections.<String>emptyList()).isEmpty(), "Empty input");
    }

    private static void chapter06() throws Exception {
        Path valid = Files.createTempFile("java-learner-valid-", ".txt");
        Path invalid = Files.createTempFile("java-learner-invalid-", ".txt");
        try {
            Files.write(valid, " 10 \n\n -3\n 0 \n".getBytes(StandardCharsets.UTF_8));
            check(SafeNumbers.read(valid).equals(Arrays.asList(10, -3, 0)), "Trim, blanks, negatives");
            Files.write(invalid, "1\n\n2\nabc\n".getBytes(StandardCharsets.UTF_8));
            try { SafeNumbers.read(invalid); throw new AssertionError("Expected invalid line error"); }
            catch (IllegalArgumentException e) { check(e.getMessage() != null && e.getMessage().contains("4"), "Error must include source line number 4"); }
            Files.delete(valid);
            throwsType(IOException.class, () -> SafeNumbers.read(valid), "Missing file");
        } finally { Files.deleteIfExists(valid); Files.deleteIfExists(invalid); }
    }

    private static void chapter07() throws Exception {
        check("hi-java-8".equals(SlugService.slug("  Hi,  Java  8! ")), "Trim and separators");
        check("a-b-c".equals(SlugService.slug("A--b__C")), "Consecutive separators");
        check("go-go".equals(SlugService.slug("goégo")), "Only ASCII letters are retained");
        check("".equals(SlugService.slug("!!")), "Only punctuation");
        throwsType(IllegalArgumentException.class, () -> SlugService.slug(null), "Null input");
    }

    private static void chapter08() {
        List<String> input = new ArrayList<String>(Arrays.asList(" Java ", "JAVA", "go", "", " Go "));
        check(TagPipeline.normalize(input).equals(Arrays.asList("go", "java")), "Normalize, distinct, sort");
        check(input.equals(Arrays.asList(" Java ", "JAVA", "go", "", " Go ")), "Input must not mutate");
        Locale old = Locale.getDefault();
        try {
            Locale.setDefault(new Locale("tr", "TR"));
            check(TagPipeline.normalize(Arrays.asList(" I ")).equals(Arrays.asList("i")), "Use Locale.ROOT, not default locale");
        } finally { Locale.setDefault(old); }
        check(TagPipeline.normalize(Collections.<String>emptyList()).isEmpty(), "Empty input");
    }

    private static void chapter09() throws Exception {
        check(ParallelSum.sum(new int[0], 2) == 0L, "Empty input");
        int[] values = { Integer.MAX_VALUE, Integer.MAX_VALUE, -1, 17, -22 };
        long expected = 2L * Integer.MAX_VALUE - 6L;
        check(ParallelSum.sum(values, 1) == expected, "One worker, use long accumulator");
        check(ParallelSum.sum(values, 8) == expected, "More workers than elements");
        throwsType(IllegalArgumentException.class, () -> ParallelSum.sum(values, 0), "Invalid workers");
    }

    private static void chapter10() throws Exception {
        Map<String, String> input = new LinkedHashMap<String, String>();
        input.put("x", "&"); input.put("q", "a b");
        check("q=a+b&x=%26".equals(QueryString.encode(input)), "Sorted keys and encoded values");
        check(input.size() == 2 && "&".equals(input.get("x")), "Input must remain unchanged");
        check("".equals(QueryString.encode(Collections.<String, String>emptyMap())), "Empty map");
        Map<String, String> unicode = new HashMap<String, String>(); unicode.put("ключ", "ёж");
        check("%D0%BA%D0%BB%D1%8E%D1%87=%D1%91%D0%B6".equals(QueryString.encode(unicode)), "UTF-8 query encoding");
        Map<String, String> nullValue = new HashMap<String, String>(); nullValue.put("x", null);
        throwsType(IllegalArgumentException.class, () -> QueryString.encode(nullValue), "Null value");
        Map<String, String> nullKey = new HashMap<String, String>(); nullKey.put(null, "x");
        throwsType(IllegalArgumentException.class, () -> QueryString.encode(nullKey), "Null key");
    }

    private static final class ProcessResult {
        final int exit; final String stdout; final String stderr;
        ProcessResult(int exit, String stdout, String stderr) { this.exit = exit; this.stdout = stdout; this.stderr = stderr; }
    }

    private static ProcessResult cli(Path file, String... command) throws Exception {
        String java = System.getProperty("java.home") + "/bin/java" + (System.getProperty("os.name").startsWith("Windows") ? ".exe" : "");
        List<String> args = new ArrayList<String>(Arrays.asList(java, "-cp", System.getProperty("java.class.path"), "TodoCli", file.toString()));
        args.addAll(Arrays.asList(command));
        Process process = new ProcessBuilder(args).start();
        int exit = process.waitFor();
        String out = new String(readStream(process.getInputStream()), StandardCharsets.UTF_8).replace("\r", "").trim();
        String err = new String(readStream(process.getErrorStream()), StandardCharsets.UTF_8).replace("\r", "").trim();
        return new ProcessResult(exit, out, err);
    }

    private static byte[] readStream(java.io.InputStream stream) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream(); byte[] buffer = new byte[4096]; int size;
        while ((size = stream.read(buffer)) != -1) bytes.write(buffer, 0, size);
        return bytes.toByteArray();
    }

    private static void chapter11() throws Exception {
        Path file = Files.createTempFile("java-learner-todo-", ".txt"); Files.delete(file);
        try {
            ProcessResult empty = cli(file, "list");
            check(empty.exit == 0 && empty.stdout.isEmpty(), "Missing file should list empty tasks");
            check(cli(file, "add", "Read Java").exit == 0, "First add");
            check(cli(file, "add", "Ship code").exit == 0, "Second add");
            ProcessResult before = cli(file, "list");
            check(before.exit == 0 && before.stdout.equals("1 [ ] Read Java\n2 [ ] Ship code"), "List format and persistent IDs");
            check(cli(file, "done", "1").exit == 0, "Mark first task done");
            ProcessResult after = cli(file, "list");
            check(after.stdout.equals("1 [x] Read Java\n2 [ ] Ship code"), "Persistence across JVM processes");
            ProcessResult wrong = cli(file, "done", "99");
            check(wrong.exit != 0 && !wrong.stderr.isEmpty(), "Unknown task must fail on stderr");
            check(cli(file, "list").stdout.equals(after.stdout), "Failed command must not mutate file");
        } finally { Files.deleteIfExists(file); }
    }

    public static void main(String[] args) throws Exception {
        if (args.length != 1) throw new IllegalArgumentException("Expected chapter number");
        switch (args[0]) {
            case "00": chapter00(); break; case "01": chapter01(); break;
            case "02": chapter02(); break; case "03": chapter03(); break;
            case "04": chapter04(); break; case "05": chapter05(); break;
            case "06": chapter06(); break; case "07": chapter07(); break;
            case "08": chapter08(); break; case "09": chapter09(); break;
            case "10": chapter10(); break; case "11": chapter11(); break;
            default: throw new IllegalArgumentException("Unknown chapter: " + args[0]);
        }
        System.out.println("PASS chapter " + args[0]);
    }
}
