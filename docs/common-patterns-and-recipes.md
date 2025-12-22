# Common Patterns & Recipes

## Overview

This guide provides copy-paste-able code snippets for common patterns used throughout PokeHub. These recipes ensure consistency and save time when implementing new features.

---

## Table of Contents

1. [Form Patterns](#form-patterns)
2. [File Upload Patterns](#file-upload-patterns)
3. [Search & Filter Patterns](#search--filter-patterns)
4. [Modal/Dialog Patterns](#modaldialog-patterns)
5. [List & Table Patterns](#list--table-patterns)
6. [Context Provider Pattern](#context-provider-pattern)
7. [Debouncing & Throttling](#debouncing--throttling)
8. [Authentication Patterns](#authentication-patterns)
9. [Pokemon-Specific Patterns](#pokemon-specific-patterns)
10. [Validation & Change Tracking Patterns](#validation--change-tracking-patterns)
11. [UI Component Patterns](#ui-component-patterns)

---

## Form Patterns

### Form with Zod Validation

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Input, Label } from '@pokehub/frontend/shared-ui-components';
import { toast } from 'sonner';

// 1. Define schema
const formSchema = z.object({
  username: z
    .string()
    .min(5, 'Username must be at least 5 characters')
    .max(15, 'Username must be less than 15 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof formSchema>;

// 2. Component
export const MyForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await submitForm(data);
      toast.success('Form submitted successfully');
    } catch (error) {
      toast.error('Failed to submit form');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          {...register('username')}
          placeholder="Enter username"
        />
        {errors.username && (
          <p className="text-sm text-destructive mt-1">
            {errors.username.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
};
```

### Form with Controlled Select

```typescript
import { Controller, useForm } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pokehub/frontend/shared-ui-components';

const MyForm = () => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      generation: '9',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="generation"
        control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select generation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Generation 1</SelectItem>
              <SelectItem value="2">Generation 2</SelectItem>
              <SelectItem value="3">Generation 3</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
    </form>
  );
};
```

---

## File Upload Patterns

### Avatar Upload with Preview

```typescript
import { useState } from 'react';
import { Avatar, AvatarImage, Button, Input, Label } from '@pokehub/frontend/shared-ui-components';
import { Upload } from 'lucide-react';

export const AvatarUpload = () => {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={preview || undefined} />
        </Avatar>
        <div>
          <Label htmlFor="avatar" className="cursor-pointer">
            <div className="flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 hover:bg-accent">
              <Upload className="h-4 w-4" />
              <span>Upload Avatar</span>
            </div>
          </Label>
          <Input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
```

### File Upload to Azure with Progress

```typescript
import { useState } from 'react';
import { getFetchClient } from '@pokehub/frontend/shared-data-provider';
import { Progress } from '@pokehub/frontend/shared-ui-components';
import { toast } from 'sonner';

export const useFileUpload = () => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setProgress(0);

    try {
      // 1. Get upload URL
      const response = await getFetchClient('NEXT_API')
        .fetchThrowsError('/api/generate-upload-url', {
          method: 'POST',
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
          }),
        });

      const { uploadUrl } = await response.json();

      // 2. Upload to Azure
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      setProgress(100);
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, progress, isUploading };
};

// Usage
const { uploadFile, progress, isUploading } = useFileUpload();

<div>
  {isUploading && <Progress value={progress} />}
  <Button onClick={() => uploadFile(file)} disabled={isUploading}>
    {isUploading ? 'Uploading...' : 'Upload'}
  </Button>
</div>
```

---

## Search & Filter Patterns

### Debounced Search

```typescript
import { useState, useEffect } from 'react';
import { Input } from '@pokehub/frontend/shared-ui-components';
import { Search } from 'lucide-react';

export const DebouncedSearch = ({ onSearch }: { onSearch: (value: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-8"
      />
    </div>
  );
};
```

### Searchable Select (Custom Hook)

```typescript
import { useState, useMemo } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Input,
  ScrollArea,
} from '@pokehub/frontend/shared-ui-components';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@pokehub/frontend/shared-utils';

interface SearchableSelectProps<T extends { id: string; name: string }> {
  items: T[];
  value: string | undefined;
  onValueChange: (value: string) => void;
  placeholder?: string;
  renderItem?: (item: T) => React.ReactNode;
}

export const SearchableSelect = <T extends { id: string; name: string }>({
  items,
  value,
  onValueChange,
  placeholder = 'Select item',
  renderItem,
}: SearchableSelectProps<T>) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    if (!search) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const selectedItem = items.find(item => item.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {selectedItem ? selectedItem.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <div className="p-2">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onValueChange(item.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                  value === item.id && 'bg-accent'
                )}
              >
                <Check
                  className={cn(
                    'h-4 w-4',
                    value === item.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {renderItem ? renderItem(item) : item.name}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
```

### Multi-Select Filter

```typescript
import { useState } from 'react';
import { Badge, Button } from '@pokehub/frontend/shared-ui-components';
import { X } from 'lucide-react';

export const MultiSelectFilter = () => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const types = ['Fire', 'Water', 'Grass', 'Electric', 'Psychic'];

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {types.map(type => (
          <Badge
            key={type}
            variant={selectedTypes.includes(type) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleType(type)}
          >
            {type}
          </Badge>
        ))}
      </div>
      {selectedTypes.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Selected:</span>
          {selectedTypes.map(type => (
            <Badge key={type} variant="secondary">
              {type}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => toggleType(type)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Modal/Dialog Patterns

### Confirmation Dialog

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@pokehub/frontend/shared-ui-components';
import { Button } from '@pokehub/frontend/shared-ui-components';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
}: ConfirmDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Usage
const [showConfirm, setShowConfirm] = useState(false);

<ConfirmDialog
  open={showConfirm}
  onOpenChange={setShowConfirm}
  title="Delete Pokemon?"
  description="Are you sure you want to delete this Pokemon? This action cannot be undone."
  onConfirm={handleDelete}
  confirmText="Delete"
  isDestructive
/>
```

### Form Dialog

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@pokehub/frontend/shared-ui-components';

export const FormDialog = ({ open, onOpenChange, onSave }) => {
  const [formData, setFormData] = useState({ name: '', level: 1 });

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Pokemon</DialogTitle>
          <DialogDescription>
            Make changes to your Pokemon configuration
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="level">Level</Label>
            <Slider
              value={[formData.level]}
              onValueChange={(value) => setFormData({ ...formData, level: value[0] })}
              min={1}
              max={100}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

## List & Table Patterns

### Card Grid with Loading

```typescript
import { Skeleton, Card, CardHeader, CardTitle, CardContent } from '@pokehub/frontend/shared-ui-components';

export const CardGrid = ({ data, isLoading }: { data?: Item[]; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No items found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map(item => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {item.description}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
```

### Infinite Scroll List

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

export const InfiniteList = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['items'],
    queryFn: ({ pageParam = 0 }) => fetchItems({ offset: pageParam }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length * 20 : undefined,
  });

  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="space-y-4">
      {data?.pages.flatMap(page => page.items).map(item => (
        <ItemCard key={item.id} item={item} />
      ))}

      {/* Observer trigger */}
      <div ref={observerRef} className="h-10" />

      {isFetchingNextPage && (
        <div className="text-center py-4">
          <Spinner />
        </div>
      )}
    </div>
  );
};
```

---

## Context Provider Pattern

### Complete Context Pattern

```typescript
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

// 1. Define types
interface MyContextValue {
  state: string;
  setState: (value: string) => void;
  computedValue: string;
}

// 2. Create context
const MyContext = createContext<MyContextValue | undefined>(undefined);

// 3. Create provider
export const MyProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState('');

  // Memoize computed values
  const computedValue = useMemo(() => {
    return state.toUpperCase();
  }, [state]);

  // Memoize context value
  const value = useMemo(
    () => ({
      state,
      setState,
      computedValue,
    }),
    [state, computedValue]
  );

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};

// 4. Create hook
export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};

// Usage:
// Wrap app:
<MyProvider>
  <App />
</MyProvider>

// In component:
const { state, setState } = useMyContext();
```

---

## Debouncing & Throttling

### Debounced Value Hook

```typescript
import { useState, useEffect } from 'react';

export const useDebouncedValue = <T,>(value: T, delay = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Usage
const [search, setSearch] = useState('');
const debouncedSearch = useDebouncedValue(search, 500);

useEffect(() => {
  // This only runs 500ms after user stops typing
  performSearch(debouncedSearch);
}, [debouncedSearch]);
```

### Debounced Callback

```typescript
import { useCallback, useRef } from 'react';

export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay = 300
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
};

// Usage
const debouncedSearch = useDebouncedCallback((value: string) => {
  performSearch(value);
}, 500);

<Input onChange={(e) => debouncedSearch(e.target.value)} />
```

---

## Authentication Patterns

### Protected Route (Client Component)

```typescript
'use client';

import { useAuthSession } from '@pokehub/frontend/shared-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const ProtectedPage = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useAuthSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
};
```

### Authenticated API Call

```typescript
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import { withAuthRetry } from '@pokehub/frontend/pokehub-data-provider';
import { getFetchClient } from '@pokehub/frontend/shared-data-provider';

export const useAuthenticatedMutation = () => {
  const { data: session } = useAuthSession();

  return useMutation({
    mutationFn: async (data: UpdateData) => {
      const response = await withAuthRetry(
        session!.accessToken,
        (token) => getFetchClient('API').fetchThrowsError('/protected', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(data),
        })
      );
      return await response.json();
    },
  });
};
```

---

## Pokemon-Specific Patterns

### Pokemon Type Badge

```typescript
import { PokemonTypeBadge } from '@pokehub/frontend/pokehub-ui-components';

<div className="flex gap-2">
  <PokemonTypeBadge type="fire" />
  <PokemonTypeBadge type="water" />
</div>
```

### Generation-Aware Data Fetch

```typescript
import { usePokemonDetails } from '@pokehub/frontend/dex-data-provider';

export const PokemonDisplay = ({ id }: { id: string }) => {
  const [generation, setGeneration] = useState(9);

  const { data: pokemon } = usePokemonDetails(id, { generation });

  return (
    <div>
      <Select value={String(generation)} onValueChange={(v) => setGeneration(Number(v))}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(gen => (
            <SelectItem key={gen} value={String(gen)}>
              Generation {gen}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {pokemon && <PokemonCard pokemon={pokemon} />}
    </div>
  );
};
```

### EV/IV Slider with Display

```typescript
export const EVSlider = ({ stat, value, onChange }: {
  stat: string;
  value: number;
  onChange: (value: number) => void;
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{stat}</span>
        <span className="text-muted-foreground">{value}/252</span>
      </div>
      <div className="flex items-center gap-4">
        <Slider
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          min={0}
          max={252}
          step={4}
          className="flex-1"
        />
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={0}
          max={252}
          className="w-16"
        />
      </div>
    </div>
  );
};
```

---

## Validation & Change Tracking Patterns

### Team Validation with Zod

```typescript
import { z } from 'zod';

// 1. Define schemas with validation rules
const pokemonInTeamSchema = z.object({
  species: z.string().min(1, 'Species is required'),
  ability: z.string().min(1, 'Ability is required'),
  item: z.string(),
  nature: z.string().min(1, 'Nature is required'),
  gender: z.string(),
  name: z.string(),
  level: z.number().min(1).max(100),
  moves: z
    .array(z.string())
    .min(1, 'Pokemon must have at least one move')
    .max(4, 'Pokemon cannot have more than 4 moves')
    .refine(
      (moves) => moves.filter((m) => m !== '').length >= 1,
      'Pokemon must have at least one move'
    ),
  evs: z
    .object({
      hp: z.number().min(0).max(252),
      atk: z.number().min(0).max(252),
      def: z.number().min(0).max(252),
      spa: z.number().min(0).max(252),
      spd: z.number().min(0).max(252),
      spe: z.number().min(0).max(252),
    })
    .refine(
      (evs) => Object.values(evs).reduce((sum, ev) => sum + ev, 0) <= 510,
      { message: 'Total EVs cannot exceed 510' }
    ),
  ivs: z.object({
    hp: z.number().min(0).max(31),
    atk: z.number().min(0).max(31),
    def: z.number().min(0).max(31),
    spa: z.number().min(0).max(31),
    spd: z.number().min(0).max(31),
    spe: z.number().min(0).max(31),
  }),
});

const teamSchema = z.object({
  name: z.string().optional(),
  generation: z.number(),
  format: z.enum(['Singles', 'Doubles']),
  tier: z.string(),
  pokemon: z.array(pokemonInTeamSchema.optional()).length(6),
});

// 2. Create validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    path: (string | number)[];
    message: string;
  }>;
}

// 3. Validation functions
export const validateTeam = (team: PokemonTeam): ValidationResult => {
  try {
    teamSchema.parse(team);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      };
    }
    throw error;
  }
};

// 4. Helper functions to get errors by slot
export const getPokemonSlotErrors = (
  result: ValidationResult,
  slotIndex: number
) => {
  return result.errors.filter((error) => error.path[1] === slotIndex);
};

export const getTeamLevelErrors = (result: ValidationResult) => {
  return result.errors.filter(
    (error) => typeof error.path[1] !== 'number'
  );
};

// 5. Usage in component
const MyTeamEditor = () => {
  const validationResult = useMemo(() => {
    return validateTeam(currentTeam);
  }, [currentTeam]);

  const canSave = validationResult.isValid && hasChanges;

  return (
    <div>
      {!validationResult.isValid && (
        <Alert variant="destructive">
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription>
            {validationResult.errors.map((error, i) => (
              <div key={i}>{error.message}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}
      <Button disabled={!canSave} onClick={handleSave}>
        Save Team
      </Button>
    </div>
  );
};
```

### Change Tracking Hook

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';

export interface TeamState {
  teamName?: string;
  generation: number;
  format: string;
  tier: string;
  pokemon: (PokemonInTeam | undefined)[];
}

export const useTeamChanges = (currentTeamState: TeamState) => {
  // Store the initial/saved state
  const [savedState, setSavedState] = useState<TeamState>(currentTeamState);
  const isFirstRender = useRef(true);

  // Initialize saved state on mount
  useEffect(() => {
    if (isFirstRender.current) {
      setSavedState(currentTeamState);
      isFirstRender.current = false;
    }
  }, []);

  // Deep comparison of two team states
  const areTeamsEqual = useCallback(
    (team1: TeamState, team2: TeamState): boolean => {
      // Compare team configuration
      if (
        team1.teamName !== team2.teamName ||
        team1.generation !== team2.generation ||
        team1.format !== team2.format ||
        team1.tier !== team2.tier
      ) {
        return false;
      }

      // Compare Pokemon array
      for (let i = 0; i < team1.pokemon.length; i++) {
        const p1 = team1.pokemon[i];
        const p2 = team2.pokemon[i];

        if (p1 === undefined && p2 === undefined) continue;
        if (p1 === undefined || p2 === undefined) return false;

        // Deep compare Pokemon properties (moves, EVs, IVs, etc.)
        if (!arePokemonEqual(p1, p2)) {
          return false;
        }
      }

      return true;
    },
    []
  );

  const arePokemonEqual = (
    p1: PokemonInTeam,
    p2: PokemonInTeam
  ): boolean => {
    // Compare basic properties
    if (
      p1.species !== p2.species ||
      p1.ability !== p2.ability ||
      p1.item !== p2.item ||
      p1.nature !== p2.nature ||
      p1.level !== p2.level
    ) {
      return false;
    }

    // Compare moves (order matters)
    if (p1.moves.length !== p2.moves.length) return false;
    for (let i = 0; i < p1.moves.length; i++) {
      if (p1.moves[i] !== p2.moves[i]) return false;
    }

    // Compare EVs and IVs
    const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
    for (const stat of stats) {
      if (p1.evs[stat] !== p2.evs[stat]) return false;
      if (p1.ivs[stat] !== p2.ivs[stat]) return false;
    }

    return true;
  };

  // Check if there are unsaved changes
  const hasChanges = useCallback((): boolean => {
    return !areTeamsEqual(currentTeamState, savedState);
  }, [currentTeamState, savedState, areTeamsEqual]);

  // Mark current state as saved (call after successful save)
  const markAsSaved = useCallback(() => {
    setSavedState(currentTeamState);
  }, [currentTeamState]);

  // Reset to last saved state (discard changes)
  const resetToSaved = useCallback((): TeamState => {
    return savedState;
  }, [savedState]);

  return {
    hasChanges: hasChanges(),
    markAsSaved,
    resetToSaved,
    savedState,
  };
};

// Usage
const MyComponent = () => {
  const { hasChanges, markAsSaved } = useTeamChanges({
    teamName: teamName,
    generation: generation,
    format: format,
    tier: tier,
    pokemon: teamPokemon,
  });

  const handleSave = async () => {
    await saveToBackend();
    markAsSaved(); // Update baseline after successful save
  };

  return (
    <Button disabled={!hasChanges} onClick={handleSave}>
      Save Changes
    </Button>
  );
};
```

### Inline Validation with Error Display

```typescript
import { useMemo } from 'react';
import { Alert, AlertDescription } from '@pokehub/frontend/shared-ui-components';
import { AlertCircle } from 'lucide-react';

export const MovesTab = ({ pokemon }: { pokemon: PokemonInTeam }) => {
  // Validate inline
  const hasValidMoves = useMemo(() => {
    return pokemon.moves.filter((m) => m !== '').length >= 1;
  }, [pokemon.moves]);

  return (
    <div className="space-y-4">
      {/* Show error inline */}
      {!hasValidMoves && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Pokemon must have at least one move selected
          </AlertDescription>
        </Alert>
      )}

      {/* Form fields */}
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((index) => (
          <MoveSelect key={index} slotIndex={index} pokemon={pokemon} />
        ))}
      </div>
    </div>
  );
};
```

### Visual Error Indicators on Cards

```typescript
import { useMemo } from 'react';
import { Card, Tooltip, TooltipContent, TooltipTrigger } from '@pokehub/frontend/shared-ui-components';
import { AlertCircle } from 'lucide-react';

export const PokemonCard = ({
  pokemon,
  validationResult,
  slotIndex,
}: {
  pokemon: PokemonInTeam;
  validationResult: ValidationResult;
  slotIndex: number;
}) => {
  // Get errors for this Pokemon
  const pokemonErrors = useMemo(
    () => getPokemonSlotErrors(validationResult, slotIndex),
    [validationResult, slotIndex]
  );
  const hasErrors = pokemonErrors.length > 0;

  return (
    <Card className={hasErrors ? 'border-destructive' : ''}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="font-medium">{pokemon.species}</span>
          {hasErrors && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">Validation Errors:</p>
                  <ul className="list-disc list-inside">
                    {pokemonErrors.map((error, index) => (
                      <li key={index}>{error.message}</li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardHeader>
      {/* Card content */}
    </Card>
  );
};
```

### Confirmation Dialog for Destructive Actions

```typescript
import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from '@pokehub/frontend/shared-ui-components';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const GenerationSelector = () => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState<number | null>(null);

  const handleGenerationChange = useCallback((newGen: number) => {
    // Check if action is destructive
    if (teamHasPokemon()) {
      setPendingGeneration(newGen);
      setShowConfirmDialog(true);
    } else {
      // Safe to change
      setGeneration(newGen);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (pendingGeneration !== null) {
      clearTeam();
      setGeneration(pendingGeneration);
      toast.success('Team cleared and generation changed', {
        description: `Switched to Generation ${pendingGeneration}`,
      });
      setShowConfirmDialog(false);
      setPendingGeneration(null);
    }
  }, [pendingGeneration]);

  return (
    <>
      <Select value={String(generation)} onValueChange={(v) => handleGenerationChange(Number(v))}>
        {/* Select content */}
      </Select>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <DialogTitle>Change Generation?</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Changing generations will <strong>clear your entire team</strong>.
              All Pokemon, moves, and configurations will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Clear Team & Change Generation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
```

---

## UI Component Patterns

### Horizontal ScrollArea

For horizontal scrolling lists (e.g., filter badges, image carousels), use shadcn/ui's ScrollArea with a horizontal ScrollBar.

```tsx
import { ScrollArea, ScrollBar } from '@pokehub/frontend/shared-ui-components';

// Horizontal scrollable list
<ScrollArea className="w-full whitespace-nowrap">
  <div className="flex w-max gap-2 p-1">
    {items.map((item) => (
      <Badge key={item.id} className="shrink-0">
        {item.name}
      </Badge>
    ))}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>
```

**Key Requirements**:
- `whitespace-nowrap` on ScrollArea - prevents content wrapping
- `w-max` on inner container - allows content to extend beyond viewport
- `shrink-0` on items - prevents items from shrinking
- `<ScrollBar orientation="horizontal" />` - enables horizontal scrollbar

### Mobile-Responsive Filter Toggle

Show/hide filters on mobile to maximize content space.

```tsx
import { Filter } from 'lucide-react';
import { useState } from 'react';

const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

// Filter toggle button (visible only on mobile)
<Button
  variant={isMobileFilterOpen ? 'secondary' : 'outline'}
  size="icon"
  className="lg:hidden"
  onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
>
  <Filter className="h-4 w-4" />
</Button>

// Desktop filters (hidden on mobile)
<div className="hidden flex-wrap gap-2 lg:flex">
  {/* Filter content */}
</div>

// Mobile filters (collapsible)
{isMobileFilterOpen && (
  <div className="lg:hidden">
    {/* Mobile filter content with horizontal scroll */}
  </div>
)}
```

**Responsive Breakpoints**:
| Class | Behavior |
|-------|----------|
| `lg:hidden` | Visible on mobile, hidden on desktop (≥1024px) |
| `hidden lg:flex` | Hidden on mobile, visible on desktop |

---

## Quick Reference

### Import Statements

```typescript
// UI Components
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Dialog,
  DialogContent,
  Input,
  Label,
  Select,
  Skeleton,
} from '@pokehub/frontend/shared-ui-components';

// Icons
import { Search, X, Loader2, Check } from 'lucide-react';

// Toast
import { toast } from 'sonner';

// React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Auth
import { useAuthSession } from '@pokehub/frontend/shared-auth';

// API
import { getFetchClient } from '@pokehub/frontend/shared-data-provider';
import { withAuthRetry } from '@pokehub/frontend/pokehub-data-provider';

// Pokemon Data
import { usePokemonDetails } from '@pokehub/frontend/dex-data-provider';

// Utilities
import { cn } from '@pokehub/frontend/shared-utils';
```

---

## Tips

1. **Always memoize context values** to prevent unnecessary re-renders
2. **Use debouncing for search inputs** to reduce API calls
3. **Provide loading skeletons** for better UX
4. **Handle errors gracefully** with toast notifications
5. **Use TypeScript generics** for reusable components
6. **Extract common patterns** into custom hooks
7. **Keep components small** and focused on a single responsibility
8. **Use composition** over prop drilling
9. **Invalidate queries** after mutations to refresh data
10. **Use `withAuthRetry`** for authenticated requests to handle token refresh

---

## Common Gotchas

### ❌ Forgetting to memoize context values

```typescript
// Bad - Creates new object every render
const value = { state, setState };

// Good - Memoized
const value = useMemo(() => ({ state, setState }), [state]);
```

### ❌ Not handling loading/error states

```typescript
// Bad - No loading/error handling
const { data } = useQuery(...);
return <div>{data.name}</div>;

// Good
const { data, isLoading, error } = useQuery(...);
if (isLoading) return <Skeleton />;
if (error) return <Error />;
return <div>{data.name}</div>;
```

### ❌ Inline functions in render

```typescript
// Bad - New function every render
<Button onClick={() => setCount(count + 1)}>Click</Button>

// Good - Stable reference
const handleClick = () => setCount(count + 1);
<Button onClick={handleClick}>Click</Button>
```

### ❌ Missing dependencies in useEffect

```typescript
// Bad - Missing dependency
useEffect(() => {
  fetchData(userId);
}, []);

// Good - Includes all dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]);
```
