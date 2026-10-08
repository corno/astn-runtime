# ASTN runtime

Runtime implementations for ASTN deserialization, serialization and unmarshalling.

## Unicode and escaping

All three delimited text forms (double quotes, single quotes and backticks)
accept literal LF and CR characters, including CRLF, as well as escaped
`\n` and `\r`. Literal and escaped forms decode to the same value. Empty
delimited values are also valid. Identifier naming advice belongs in a
separate validation overlay, not the ASTN lexer.

Delimited text accepts four-digit `\uXXXX` escapes. Invalid hexadecimal digits
are reported immediately with the actual character or end of input. Escaped
high surrogates must be followed immediately by an escaped low surrogate;
escaped lone low surrogates are rejected. Valid pairs produce two UTF-16 code
units, matching the new ASTN implementation.

Delimited serializers escape all U+0000–U+001F control characters, keeping
the short escapes `\b`, `\f`, `\n`, `\r` and `\t` and using uppercase
four-digit `\uXXXX` escapes for the rest. This keeps control characters visible
in editors without changing the accepted ASTN syntax. There is no `\v`
escape; vertical tab (U+000B) is serialized as `\u000B`.
Delimiter-specific serializers escape
their active delimiter. The public `Escaped` serializer uses double-quote
escaping.

Error descriptions include one-based source locations. CR and LF start a new
line, with CRLF counted once. Absolute positions count UTF-16 code units;
columns honor the configured tab size.

The `surrogate pair` lexer-error variant and location-prefixed descriptions
are observable changes. Consumers exhaustively matching lexer-error variants
must handle the new variant. Existing ASTN header/include syntax is retained;
XML-specific character restrictions are not applied.
