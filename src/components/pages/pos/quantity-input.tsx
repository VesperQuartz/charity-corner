import React, { useEffect, useState } from "react";

export const QuantityInput = ({
  quantity,
  onUpdate,
}: {
  quantity: number;
  onUpdate: (newQty: number) => void;
}) => {
  const [val, setVal] = useState(quantity.toString());

  // Sync with prop if it changes externally (e.g. +/- buttons)
  useEffect(() => {
    setVal(quantity.toString());
  }, [quantity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setVal(newVal);

    // If it's a valid number, update parent immediately
    if (newVal !== "") {
      const parsed = parseInt(newVal);
      if (!isNaN(parsed) && parsed >= 1) {
        onUpdate(parsed);
      }
    }
  };

  const handleBlur = () => {
    // If empty or invalid on blur, reset to current prop value
    if (val === "" || isNaN(parseInt(val)) || parseInt(val) < 1) {
      setVal(quantity.toString());
    } else {
      // Format correctly (e.g. remove leading zeros)
      setVal(parseInt(val).toString());
    }
  };

  return (
    <input
      type="number"
      min="1"
      className="mx-1 w-12 rounded border border-gray-200 py-1 text-center font-medium focus:ring-2 focus:ring-pink-500 focus:outline-none"
      value={val}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};
