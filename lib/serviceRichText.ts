export const SERVICE_RICH_TEXT_PREFIX =
  "__DS_SERVICE_RICH_V2__:";

const LEGACY_SERVICE_TEXT_PREFIX =
  "__DS_SERVICE_TEXT_V1__:";

export type ServiceRichTextMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type ServiceRichTextNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ServiceRichTextNode[];
  marks?: ServiceRichTextMark[];
  text?: string;
};

export type ServiceRichTextDocument = {
  type: "doc";
  content: ServiceRichTextNode[];
};

type LegacyServiceTextItem = {
  text?: unknown;
  bold?: unknown;
  italic?: unknown;
  size?: unknown;
};

const ALLOWED_FONT_SIZES =
  new Set([
    "13px",
    "15px",
    "18px",
  ]);

export function emptyServiceRichTextDocument(): ServiceRichTextDocument {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
      },
    ],
  };
}

function cleanTextMarks(
  marks: unknown,
): ServiceRichTextMark[] | undefined {
  if (!Array.isArray(marks)) {
    return undefined;
  }

  const next:
    ServiceRichTextMark[] = [];

  for (const mark of marks) {
    if (
      !mark ||
      typeof mark !== "object"
    ) {
      continue;
    }

    const value =
      mark as {
        type?: unknown;
        attrs?: unknown;
      };

    if (
      value.type === "bold" ||
      value.type === "italic"
    ) {
      next.push({
        type: value.type,
      });

      continue;
    }

    if (
      value.type === "textStyle" &&
      value.attrs &&
      typeof value.attrs === "object"
    ) {
      const fontSize =
        (
          value.attrs as {
            fontSize?: unknown;
          }
        ).fontSize;

      if (
        typeof fontSize === "string" &&
        ALLOWED_FONT_SIZES.has(
          fontSize,
        )
      ) {
        next.push({
          type: "textStyle",
          attrs: {
            fontSize,
          },
        });
      }
    }
  }

  return next.length
    ? next
    : undefined;
}

function normalizeInlineNode(
  value: unknown,
): ServiceRichTextNode | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const node =
    value as {
      type?: unknown;
      text?: unknown;
      marks?: unknown;
    };

  if (
    node.type === "hardBreak"
  ) {
    return {
      type: "hardBreak",
    };
  }

  if (
    node.type !== "text" ||
    typeof node.text !== "string"
  ) {
    return null;
  }

  if (!node.text) {
    return null;
  }

  const marks =
    cleanTextMarks(
      node.marks,
    );

  return {
    type: "text",
    text: node.text,
    ...(marks
      ? { marks }
      : {}),
  };
}

function normalizeParagraphNode(
  value: unknown,
): ServiceRichTextNode | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const node =
    value as {
      type?: unknown;
      content?: unknown;
    };

  if (
    node.type !== "paragraph"
  ) {
    return null;
  }

  const content =
    Array.isArray(
      node.content,
    )
      ? node.content
          .map(
            normalizeInlineNode,
          )
          .filter(
            (
              item,
            ): item is ServiceRichTextNode =>
              item !== null,
          )
      : [];

  return {
    type: "paragraph",
    ...(content.length
      ? { content }
      : {}),
  };
}

export function normalizeServiceRichTextDocument(
  value: unknown,
): ServiceRichTextDocument {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return emptyServiceRichTextDocument();
  }

  const document =
    value as {
      type?: unknown;
      content?: unknown;
    };

  if (
    document.type !== "doc" ||
    !Array.isArray(
      document.content,
    )
  ) {
    return emptyServiceRichTextDocument();
  }

  const content =
    document.content
      .map(
        normalizeParagraphNode,
      )
      .filter(
        (
          item,
        ): item is ServiceRichTextNode =>
          item !== null,
      );

  return {
    type: "doc",
    content:
      content.length
        ? content
        : [
            {
              type:
                "paragraph",
            },
          ],
  };
}

function fontSizeFromLegacySize(
  value: unknown,
): string | null {
  if (value === "small") {
    return "13px";
  }

  if (value === "large") {
    return "18px";
  }

  return null;
}

function paragraphFromPlainText(
  text: string,
  options?: {
    bold?: boolean;
    italic?: boolean;
    fontSize?: string | null;
  },
): ServiceRichTextNode | null {
  const cleaned =
    text.trim();

  if (!cleaned) {
    return null;
  }

  const marks:
    ServiceRichTextMark[] = [];

  if (options?.bold) {
    marks.push({
      type: "bold",
    });
  }

  if (options?.italic) {
    marks.push({
      type: "italic",
    });
  }

  if (
    options?.fontSize &&
    ALLOWED_FONT_SIZES.has(
      options.fontSize,
    )
  ) {
    marks.push({
      type: "textStyle",
      attrs: {
        fontSize:
          options.fontSize,
      },
    });
  }

  return {
    type: "paragraph",
    content: [
      {
        type: "text",
        text: cleaned,
        ...(marks.length
          ? { marks }
          : {}),
      },
    ],
  };
}

function legacyStoredValueToParagraph(
  value: string,
): ServiceRichTextNode | null {
  const cleaned =
    value.trim();

  if (!cleaned) {
    return null;
  }

  if (
    !cleaned.startsWith(
      LEGACY_SERVICE_TEXT_PREFIX,
    )
  ) {
    return paragraphFromPlainText(
      cleaned,
    );
  }

  try {
    const parsed =
      JSON.parse(
        cleaned.slice(
          LEGACY_SERVICE_TEXT_PREFIX.length,
        ),
      ) as LegacyServiceTextItem;

    const text =
      typeof parsed.text ===
      "string"
        ? parsed.text
        : "";

    return paragraphFromPlainText(
      text,
      {
        bold:
          parsed.bold ===
          true,
        italic:
          parsed.italic ===
          true,
        fontSize:
          fontSizeFromLegacySize(
            parsed.size,
          ),
      },
    );
  } catch {
    return paragraphFromPlainText(
      cleaned,
    );
  }
}

export function storedServiceTextToDocument(
  values: string[],
): ServiceRichTextDocument {
  const richValue =
    values.find(
      (value) =>
        typeof value ===
          "string" &&
        value
          .trim()
          .startsWith(
            SERVICE_RICH_TEXT_PREFIX,
          ),
    );

  if (richValue) {
    try {
      return normalizeServiceRichTextDocument(
        JSON.parse(
          richValue
            .trim()
            .slice(
              SERVICE_RICH_TEXT_PREFIX.length,
            ),
        ),
      );
    } catch {
      // Fall through to legacy/plain conversion.
    }
  }

  const content =
    values
      .filter(
        (
          value,
        ): value is string =>
          typeof value ===
          "string",
      )
      .map(
        legacyStoredValueToParagraph,
      )
      .filter(
        (
          item,
        ): item is ServiceRichTextNode =>
          item !== null,
      );

  return {
    type: "doc",
    content:
      content.length
        ? content
        : [
            {
              type:
                "paragraph",
            },
          ],
  };
}

function inlinePlainText(
  node: ServiceRichTextNode,
): string {
  if (
    node.type === "text"
  ) {
    return node.text ?? "";
  }

  if (
    node.type === "hardBreak"
  ) {
    return "\n";
  }

  return (
    node.content ?? []
  )
    .map(
      inlinePlainText,
    )
    .join("");
}

export function serviceRichTextParagraphs(
  document: ServiceRichTextDocument,
): ServiceRichTextNode[] {
  return normalizeServiceRichTextDocument(
    document,
  ).content.filter(
    (node) =>
      node.type ===
        "paragraph" &&
      inlinePlainText(
        node,
      ).trim().length > 0,
  );
}

export function serviceRichTextToPlainLines(
  document: ServiceRichTextDocument,
): string[] {
  return serviceRichTextParagraphs(
    document,
  )
    .map(
      (paragraph) =>
        inlinePlainText(
          paragraph,
        ).trim(),
    )
    .filter(Boolean);
}

export function hasServiceRichTextContent(
  document: ServiceRichTextDocument,
): boolean {
  return (
    serviceRichTextToPlainLines(
      document,
    ).length > 0
  );
}

export function documentToStoredServiceText(
  document: ServiceRichTextDocument,
): string[] {
  const normalized =
    normalizeServiceRichTextDocument(
      document,
    );

  if (
    !hasServiceRichTextContent(
      normalized,
    )
  ) {
    return [];
  }

  return [
    SERVICE_RICH_TEXT_PREFIX +
      JSON.stringify(
        normalized,
      ),
  ];
}

export function storedServiceTextToPlainLines(
  values: string[],
): string[] {
  return serviceRichTextToPlainLines(
    storedServiceTextToDocument(
      values,
    ),
  );
}
