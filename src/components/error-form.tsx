import type { AnyFieldApi } from "@tanstack/react-form";

export const FormError = ({ field }: { field: AnyFieldApi }) => {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <div className="flex flex-col flex-wrap gap-2">
          {field.state.meta.errors.map((error) => {
            return (
              <p key={error} className="text-xs font-bold text-red-500">
                {error.message}
              </p>
            );
          })}
        </div>
      ) : null}
    </>
  );
};
