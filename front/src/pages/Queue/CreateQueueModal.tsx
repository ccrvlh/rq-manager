import { QueueCreate, QueuePriority } from "@/pages/Queue/types";
import { useCreateQueue } from "@/services/queuesService";
import {
  Button,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

interface CreateQueueModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateQueueModal({
  opened,
  onClose,
  onSuccess,
}: CreateQueueModalProps) {
  const createQueueMutation = useCreateQueue();

  const form = useForm({
    initialValues: {
      name: "",
      priority: QueuePriority.NORMAL,
      description: "",
      default_job_timeout: 180,
      default_result_ttl: 500,
      default_failure_ttl: 31536000,
      tags: [] as string[],
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : "Name is required"),
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    createQueueMutation.mutate(values as QueueCreate, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: (error) => {
        notifications.show({
          title: "Error creating queue",
          message: error instanceof Error ? error.message : "An error occurred",
          color: "red",
        });
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create New Queue" size="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="my-queue"
            {...form.getInputProps("name")}
            required
          />

          <Select
            label="Priority"
            data={[
              { value: QueuePriority.LOW, label: "Low" },
              { value: QueuePriority.NORMAL, label: "Normal" },
              { value: QueuePriority.HIGH, label: "High" },
              { value: QueuePriority.CRITICAL, label: "Critical" },
            ]}
            {...form.getInputProps("priority")}
          />

          <Textarea
            label="Description"
            placeholder="Optional description for this queue"
            {...form.getInputProps("description")}
          />

          <NumberInput
            label="Default Job Timeout (seconds)"
            {...form.getInputProps("default_job_timeout")}
            min={1}
          />

          <NumberInput
            label="Default Result TTL (seconds)"
            {...form.getInputProps("default_result_ttl")}
            min={1}
          />

          <NumberInput
            label="Default Failure TTL (seconds)"
            {...form.getInputProps("default_failure_ttl")}
            min={1}
          />

          <MultiSelect
            label="Tags"
            placeholder="Add tags..."
            {...form.getInputProps("tags")}
            data={[]}
            searchable
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createQueueMutation.isPending}>
              Create Queue
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
