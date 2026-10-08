import * as p_ from 'pareto-core/serializer'
import type * as p_schema from 'pareto-core/schema'
import p_list_from_text from 'pareto-core/refiner/specials/list_from_text'

//schemas
import type * as s_in from "./schema.js"

namespace s_parameters {

    export type Parameters = {
        'add delimiters': boolean
    }

}

namespace declarations {
    export type Quoted = p_.Serializer_With_Parameter<
        s_in.Quoted,
        s_parameters.Parameters
    >
    export type Apostrophed = p_.Serializer_With_Parameter<
        s_in.Apostrophed,
        s_parameters.Parameters
    >
    export type Backticked = p_.Serializer_With_Parameter<
        s_in.Backticked,
        s_parameters.Parameters
    >
    export type Undelimited = p_.Serializer<
        s_in.Undelimited
    >
}


export const Escaped: p_.Serializer<
    s_in.Escaped
> = ($) => Escaped_With_Delimiter($, 0x22)

const Escaped_With_Delimiter = ($: string, delimiter: number): string => p_.ph.list_of_characters(p_.from.list(p_list_from_text(
    $,
    ($) => $
)).flatten(
    ($) => {
        switch ($) {
            //I see no need to escape the slash, as it is not an operator character in JSON, and it is not whitespace
            // case 0x2F: // slash (\/)
            //     return p_.literal.list([
            //         0x5c, // \
            //         0x2f, // /
            //     ])
            case 0x5C: // \ (\\)
                return p_.literal.list([
                    0x5C, // \
                    0x5C, // \
                ])
            case 0x08: // backspace (\b)
                return p_.literal.list([
                    0x5C, // \
                    0x62, // b
                ])
            case 0x0C: // form feed (\f)
                return p_.literal.list([
                    0x5C, // \
                    0x66, // f
                ])
            case 0x0A: // line feed (\n)
                return p_.literal.list([
                    0x5C, // \
                    0x6E, // n
                ])
            case 0x0D: // carriage return (\r)
                return p_.literal.list([
                    0x5C, // \
                    0x72, // r
                ])
            case 0x09: // horizontal tab (\t)
                return p_.literal.list([
                    0x5C, // \
                    0x74, // t
                ])
            default:
                if ($ < 0x20) {
                    const low = $ & 0x0F
                    return p_.literal.list([
                        0x5C, 0x75, 0x30, 0x30,
                        0x30 + ($ >> 4),
                        low < 10 ? 0x30 + low : 0x41 + low - 10,
                    ])
                }
                return $ === delimiter
                    ? p_.literal.list([0x5C, $])
                    : p_.literal.list([$])
        }
    }
)
)

export const Quoted: declarations.Quoted = ($, $p) => $p['add delimiters']
    ? p_.ph.composed([
        p_.ph.literal('"'),
        Escaped($),
        p_.ph.literal('"'),
    ])
    : Escaped($)

export const ID: declarations.Apostrophed = ($, $p) => $p['add delimiters']
    ? p_.ph.composed([
        p_.ph.literal("'"),
        Escaped_With_Delimiter($, 0x27),
        p_.ph.literal("'"),
    ])
    : Escaped_With_Delimiter($, 0x27)

export const Apostrophed: declarations.Apostrophed = ($, $p) => $p['add delimiters']
    ? p_.ph.composed([
        p_.ph.literal("'"),
        Escaped_With_Delimiter($, 0x27),
        p_.ph.literal("'"),
    ])
    : Escaped_With_Delimiter($, 0x27)

export const Backticked: declarations.Backticked = ($, $p) => $p['add delimiters']
    ? p_.ph.composed([
        p_.ph.literal("`"),
        Escaped_With_Delimiter($, 0x60),
        p_.ph.literal("`"),
    ])
    : Escaped_With_Delimiter($, 0x60)

export const Undelimited: declarations.Undelimited = ($) => $ //FIXME: this needs escaping of the operator characters and whitespace