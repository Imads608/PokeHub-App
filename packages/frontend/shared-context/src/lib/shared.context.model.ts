//export type ContextFieldType = 'Read' | 'ReadWrite';

export type ContextFieldType = 'Read' | 'ReadWrite';

export type ContextField<S, Type extends ContextFieldType> = { value: S } & (Type extends 'ReadWrite'
  ? { setValue: (newVal: S) => void }
  : // eslint-disable-next-line @typescript-eslint/ban-types
    {});
/*

export type ContextField<S, Type extends ContextFieldType> = { value: S } & (Type extends 'ReadWrite'
  ? { setValue: (newVal: S) => void }
  : // eslint-disable-next-line @typescript-eslint/ban-types
    {});
*/
