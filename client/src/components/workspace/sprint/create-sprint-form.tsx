// create-sprint-form.tsx
// This file provides the form component for creating a new sprint, including validation, input fields, and submission logic.
import React from "react";
import { z } from "zod";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, Loader } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "../../ui/textarea";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { toast } from "@/hooks/use-toast";
import { createSprintMutationFn } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetNextSprintNumberQuery } from "@/hooks/api/use-get-next-sprint-number";

export default function CreateSprintForm(props: {
  projectId: string;
  onClose: () => void;
}) {
  const { projectId, onClose } = props;

  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createSprintMutationFn,
  });

  // Get the next available sprint number
  const { data: nextSprintData, isLoading: isLoadingNextNumber } = useGetNextSprintNumberQuery({
    workspaceId,
    projectId,
  });

  const formSchema = z.object({
    name: z.string().trim().min(1, {
      message: "Sprint name is required",
    }),
    description: z.string().trim().optional(),
    sprintNumber: z.number().int().min(1, {
      message: "Sprint number must be at least 1",
    }),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    capacity: z.number().int().min(1).max(200).default(40),
    status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).default('PLANNED'),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      sprintNumber: nextSprintData?.nextSprintNumber || 1,
      capacity: 40,
      status: 'PLANNED',
    },
  });

  // Update form when next sprint number is loaded
  React.useEffect(() => {
    if (nextSprintData?.nextSprintNumber) {
      form.setValue('sprintNumber', nextSprintData.nextSprintNumber);
    }
  }, [nextSprintData, form]);

  const statusOptions = [
    { label: "Planned", value: "PLANNED" },
    { label: "Active", value: "ACTIVE" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;
    
    const payload = {
      workspaceId,
      projectId,
      data: {
        ...values,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
      },
    };

    mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["sprints", workspaceId, projectId],
        });

        toast({
          title: "Success",
          description: "Sprint created successfully",
          variant: "success",
        });
        onClose();
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create sprint",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1 className="text-xl tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1 text-center sm:text-left">
            Create Sprint
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Create a new sprint for project planning and task organization
          </p>
        </div>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Sprint Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                    Sprint Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Sprint 1: User Authentication"
                      className="!h-[48px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                    Description
                    <span className="text-xs font-extralight ml-2">
                      Optional
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Sprint description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sprint Number */}
            <FormField
              control={form.control}
              name="sprintNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Sprint Number
                    {isLoadingNextNumber && (
                      <span className="text-xs font-extralight ml-2">
                        Loading...
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder={isLoadingNextNumber ? "Loading..." : "1"}
                      className="!h-[48px]"
                      disabled={isLoadingNextNumber}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Capacity */}
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sprint Capacity (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="200"
                      placeholder="40"
                      className="!h-[48px]"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 40)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions?.map((status) => (
                        <SelectItem
                          className="!capitalize"
                          key={status.value}
                          value={status.value}
                        >
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full flex-1 pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a start date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                        defaultMonth={new Date()}
                        fromMonth={new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Date */}
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full flex-1 pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick an end date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                        defaultMonth={new Date()}
                        fromMonth={new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              className="flex place-self-end h-[40px] text-white font-semibold"
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader className="animate-spin" />}
              Create Sprint
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
} 