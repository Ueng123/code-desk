export type Language = "python" | "csharp";

export const languages: Record<
  Language,
  { name: string; file: string; sample: string }
> = {
  python: {
    name: "Python",
    file: "solution.py",
    sample: `# 두 수의 합을 구해보세요.
# 표준 라이브러리만 사용해 실행할 수 있습니다.

def solution(numbers, target):
    seen = {}

    for index, number in enumerate(numbers):
        complement = target - number
        if complement in seen:
            return [seen[complement], index]
        seen[number] = index

    return []


numbers = [2, 7, 11, 15]
answer = solution(numbers, 9)
print(answer)
`,
  },
  csharp: {
    name: "C#",
    file: "Solution.cs",
    sample: `using System;
using System.Collections.Generic;

// .NET 8 표준 라이브러리를 사용할 수 있습니다.
class Solution
{
    static int[] TwoSum(int[] numbers, int target)
    {
        var seen = new Dictionary<int, int>();
        for (int i = 0; i < numbers.Length; i++)
        {
            int complement = target - numbers[i];
            if (seen.TryGetValue(complement, out int index))
                return new[] { index, i };
            seen[numbers[i]] = i;
        }
        return Array.Empty<int>();
    }

    static void Main()
    {
        var answer = TwoSum(new[] { 2, 7, 11, 15 }, 9);
        Console.WriteLine(string.Join(", ", answer));
    }
}
`,
  },
};
