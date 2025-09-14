import { useCreateJob } from "@/services/jobs/jobsService";
import { useQueues } from "@/services/queues/queuesService";
import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { Queue } from "../Queue/types";

interface CreateJobModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface JobFormData {
  func_name: string;
  queue: string;
  args: string;
  kwargs: string;
  description?: string;
  timeout?: number;
}

export function CreateJobModal({
  opened,
  onClose,
  onSuccess,
}: CreateJobModalProps) {
  const createJobMutation = useCreateJob();
  const { data: queuesData } = useQueues({ limit: 100, offset: 0 });

  const form = useForm({
    initialValues: {
      func_name: "",
      queue: "default",
      args: "[]",
      kwargs: "{}",
      description: "",
      timeout: 180,
    },
    validate: {
      func_name: (value) =>
        value.trim().length > 0 ? null : "Function name is required",
      queue: (value) => (value.trim().length > 0 ? null : "Queue is required"),
      args: (value) => {
        try {
          if (value.trim() === "") return null;
          JSON.parse(value);
          return null;
        } catch {
          return 'Args must be a valid JSON array (e.g., ["arg1", 42, true])';
        }
      },
      kwargs: (value) => {
        try {
          if (value.trim() === "") return null;
          JSON.parse(value);
          return null;
        } catch {
          return 'Kwargs must be a valid JSON object (e.g., {"key": "value"})';
        }
      },
    },
  });

  const handleSubmit = (values: JobFormData) => {
    try {
      // Parse args and kwargs from strings to actual objects
      const parsedArgs = values.args.trim() ? JSON.parse(values.args) : [];
      const parsedKwargs = values.kwargs.trim()
        ? JSON.parse(values.kwargs)
        : {};

      const jobData = {
        func_name: values.func_name.trim(),
        queue: values.queue.trim(),
        args: parsedArgs,
        kwargs: parsedKwargs,
        description: values.description?.trim() || undefined,
        timeout: values.timeout,
      };

      createJobMutation.mutate(jobData, {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
          notifications.show({
            title: "Success",
            message: "Job created successfully",
            color: "green",
          });
        },
        onError: (error) => {
          notifications.show({
            title: "Error creating job",
            message:
              error instanceof Error ? error.message : "An error occurred",
            color: "red",
          });
        },
      });
    } catch (error) {
      notifications.show({
        title: "Validation Error",
        message: "Please check your input and try again",
        color: "red",
      });
    }
  };

  const queueOptions = queuesData?.data.map((queue: Queue) => ({
    value: queue.name,
    label: queue.name,
  }));

  return (
    <Modal opened={opened} onClose={onClose} title="Create New Job" size="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Function Name"
            placeholder="my_module.my_function"
            description="The Python function to be executed (e.g., tasks.send_email)"
            {...form.getInputProps("func_name")}
            required
          />

          <Select
            label="Queue"
            placeholder="Select a queue"
            data={
              queueOptions?.length
                ? queueOptions
                : [{ value: "default", label: "default" }]
            }
            searchable
            {...form.getInputProps("queue")}
            required
          />

          <Textarea
            label="Args"
            placeholder='["arg1", 42, true]'
            description="JSON array of arguments to pass to the function"
            {...form.getInputProps("args")}
            minRows={3}
          />

          <Textarea
            label="Kwargs"
            placeholder='{"key": "value", "count": 42}'
            description="JSON object of keyword arguments to pass to the function"
            {...form.getInputProps("kwargs")}
            minRows={3}
          />

          <TextInput
            label="Description"
            placeholder="Optional job description"
            {...form.getInputProps("description")}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createJobMutation.isPending}>
              Create Job
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
