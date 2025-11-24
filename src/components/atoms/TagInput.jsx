import { useState, useRef, useEffect, forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { ApperIcon } from '@/components/ApperIcon';

const TagInput = forwardRef(({ 
  name,
  value = "",
  onChange,
  placeholder = "Type and press Enter to add tags",
  disabled = false,
  className = "",
  label,
  ...props 
}, ref) => {
  const [tags, setTags] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);
  
  // Parse comma-separated string to tags array on mount and when value changes
  useEffect(() => {
    if (value && typeof value === 'string') {
      const parsedTags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
      setTags(parsedTags);
    } else if (!value) {
      setTags([]);
    }
  }, [value]);

  // Convert tags array to comma-separated string and call onChange
  const handleTagsChange = (newTags) => {
    const tagString = newTags.join(',');
    if (onChange) {
      const event = {
        target: {
          name,
          value: tagString
        }
      };
      onChange(event);
    }
  };

  const addTag = (tagText) => {
    const trimmedTag = tagText.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      handleTagsChange(newTags);
    }
  };

  const removeTag = (tagToRemove) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    handleTagsChange(newTags);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
      setInputValue("");
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className={cn(
        "flex flex-wrap gap-2 p-3 border rounded-lg min-h-[42px] bg-white",
        "focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500",
        disabled && "bg-gray-50 cursor-not-allowed",
        "transition-colors duration-200"
      )}>
        {/* Display existing tags */}
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              >
                <ApperIcon name="X" size={12} />
              </button>
            )}
          </span>
        ))}
        
        {/* Input for adding new tags */}
        {!disabled && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] outline-none bg-transparent"
            {...props}
          />
        )}
      </div>
      
      {!disabled && (
        <p className="text-xs text-gray-500 mt-1">
          Press Enter to add tags. Click × to remove tags.
        </p>
      )}
    </div>
  );
});

TagInput.displayName = 'TagInput';

export default TagInput;