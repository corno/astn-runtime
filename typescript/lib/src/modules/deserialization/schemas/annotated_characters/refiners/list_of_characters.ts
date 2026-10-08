import * as p_ from 'pareto-core/refiner'

import type * as s_out from "../schema.js"
import type * as s_function from "../../parse_tree_deserialization/schema.js"
import type * as s_in from "../../list_of_characters/schema.js"


namespace declarations {

    export type Annotated_Characters = p_.Refiner_Without_Error_With_Parameter<
        s_out.Annotated_Characters,
        s_in.List_Of_Characters,
        s_function.Parameters
    >



}

/**
 * Creates a string iterator that allows iterating over characters in a string,
 * while keeping track of line numbers, columns, and line indentation.
 */
export const Annotated_Characters: declarations.Annotated_Characters = ($, $p) => p_.from.list(
    $,
).map_with_state<
    s_out.Annotated_Characters,
    s_out.Annotated_Character,
    {
        'location': {
            'absolute': number
            'relative': {
                'line': number
                'column': number
            }
        },
        'line indentation': number | null
        'found carriage return before': boolean
    }
>(
    {
        'location': {
            'absolute': 0,
            'relative': {
                'line': 0,
                'column': 0,
            }
        },
        'line indentation': null,
        'found carriage return before': false,
    },
    (value, state): s_out.Annotated_Character => ({
        'code': value,
        'location': state.location,
        'line indentation': state['line indentation'] !== null
            ? state['line indentation']
            : state.location.relative.column,
    }),
    (value, state) => {
        // A line feed directly after a carriage return does not start another line.
        return value.code === 0x0A /* line feed */ && state['found carriage return before']
            ? {
                'location': {
                    'absolute': state.location.absolute + 1,
                    'relative': state.location.relative,
                },
                'line indentation': null,
                'found carriage return before': false,
            }
            : value.code === 0x0A /* line feed */ || value.code === 0x0D /* carriage return */
                ? {
                    'location': {
                        'absolute': state.location.absolute + 1,
                        'relative': {
                            'line': state.location.relative.line + 1,
                            'column': 0,
                        },
                    },

                    'line indentation': null,
                    'found carriage return before': value.code === 0x0D /* carriage return */,
                }
                : {
                    'location': {
                        'absolute': state.location.absolute + 1,
                        'relative': {
                            'line': state.location.relative.line,
                            'column': state.location.relative.column + (value.code === 0x09 /* tab */
                                ? $p['tab size']
                                : 1),
                        }
                    },
                    'line indentation': state['line indentation'] !== null
                        ? state['line indentation']
                        : value.code === 0x20 /* space */ || value.code === 0x09 /* tab */
                            ? null
                            : state.location.relative.column,
                    'found carriage return before': value.code === 0x0D /* carriage return */,
                }
    },
    (final_list, final_state) => ({
        'characters': final_list,
        'end': final_state.location,
    })
)