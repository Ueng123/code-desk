import {
  completeFromList,
  ifNotIn,
  type Completion,
  type CompletionContext,
} from "@codemirror/autocomplete";

const keywords =
  "abstract as async await base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly record ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using var virtual void volatile while yield".split(
    " ",
  );
const types =
  "Console Math MathF Convert String Array List Dictionary HashSet Queue Stack PriorityQueue SortedSet SortedDictionary LinkedList IEnumerable ICollection IList IDictionary Enumerable StringBuilder Exception ArgumentException InvalidOperationException IndexOutOfRangeException FormatException Random DateTime TimeSpan Task Tuple ValueTuple Nullable Comparer EqualityComparer KeyValuePair".split(
    " ",
  );
const members: Record<string, string[]> = {
  Console: ["WriteLine", "Write", "ReadLine", "Read", "Error", "In", "Out"],
  Math: [
    "Abs",
    "Max",
    "Min",
    "Pow",
    "Sqrt",
    "Ceiling",
    "Floor",
    "Round",
    "Clamp",
    "Sign",
    "Log",
    "Exp",
    "PI",
    "E",
  ],
  MathF: [
    "Abs",
    "Max",
    "Min",
    "Pow",
    "Sqrt",
    "Ceiling",
    "Floor",
    "Round",
    "PI",
  ],
  Array: [
    "Empty",
    "Sort",
    "Reverse",
    "Copy",
    "IndexOf",
    "BinarySearch",
    "Find",
    "Fill",
    "Resize",
    "AsReadOnly",
  ],
  String: [
    "Join",
    "Concat",
    "Format",
    "IsNullOrEmpty",
    "IsNullOrWhiteSpace",
    "Empty",
    "Compare",
    "Equals",
  ],
  string: [
    "Join",
    "Concat",
    "Format",
    "IsNullOrEmpty",
    "IsNullOrWhiteSpace",
    "Empty",
    "Compare",
    "Equals",
  ],
  Convert: [
    "ToInt32",
    "ToInt64",
    "ToDouble",
    "ToString",
    "ToBoolean",
    "ToChar",
  ],
  int: ["Parse", "TryParse", "MaxValue", "MinValue"],
  long: ["Parse", "TryParse", "MaxValue", "MinValue"],
  double: ["Parse", "TryParse", "MaxValue", "MinValue", "IsNaN", "IsInfinity"],
  Enumerable: ["Range", "Repeat", "Empty"],
};
const globals: Completion[] = [
  ...keywords.map((label) => ({ label, type: "keyword" })),
  ...types.map((label) => ({ label, type: "class", detail: ".NET" })),
];
const identifiers = ifNotIn(
  ["LineComment", "BlockComment", "Comment", "String", "StringLiteral"],
  completeFromList(globals),
);

export const csharpCompletions = ifNotIn(
  ["LineComment", "BlockComment", "Comment", "String", "StringLiteral"],
  (context: CompletionContext) => {
    const qualified = context.matchBefore(
      /\b(?:Console|MathF?|Array|String|string|Convert|int|long|double|Enumerable)\.[A-Za-z_]\w*/,
    );
    const dot =
      qualified ??
      context.matchBefore(
        /\b(?:Console|MathF?|Array|String|string|Convert|int|long|double|Enumerable)\./,
      );
    if (dot) {
      const [owner] = dot.text.split(".");
      return {
        from: dot.from + owner.length + 1,
        options: members[owner].map((label) => ({
          label,
          type: "property",
          detail: owner,
        })),
        validFor: /^\w*$/,
      };
    }
    // Built-in names are globals, not instance members (for example, x.Console).
    const word = context.matchBefore(/[A-Za-z_]\w*/);
    const start = word?.from ?? context.pos;
    if (start > 0 && context.state.sliceDoc(start - 1, start) === ".")
      return null;
    return identifiers(context);
  },
);
