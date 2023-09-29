"use client";

import { useBoardStore } from "@/store/BoardStore";
import { useEffect, useState } from "react";
import { DragDropContext, DropResult, Droppable } from "react-beautiful-dnd";
import Column from "./Column";

const mockData: Board = {
  columns: new Map<TypedColumn, Column>([
    ["todo", {
      id: "todo",
      todos: [
        { $id: "1", $createdAt: "2023-09-25", title: "Tarefa 1", status: "todo" },
        { $id: "2", $createdAt: "2023-09-26", title: "Tarefa 2", status: "todo" },
      ],
    }],
    ["inprogress", {
      id: "inprogress",
      todos: [
        { $id: "3", $createdAt: "2023-09-27", title: "Tarefa 3", status: "inprogress" },
      ],
    }],
    ["done", {
      id: "done",
      todos: [],
    }],
  ]),
}

function Board() {
  const [screentWidth, setScreenWidth] = useState(Number);
  const direction = screentWidth <= 600 ? "vertical" : "horizontal";
  const [board, setBoard] = useState<Board>(mockData)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setScreenWidth(window.innerWidth);
    }
  }, []);

  const updateTodoInDB = (todo: Todo, newColumnId: TypedColumn) => {
    console.log(`Todo with ID: ${todo.$id} moved to column: ${newColumnId}`)
  }

  const handleOnDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    // dropped outside the board
    if (!destination) return;

    // Handle column drag
    if (type === "column") {
      const entries = Array.from(board.columns.entries());
      const [removed] = entries.splice(source.index, 1);
      entries.splice(destination.index, 0, removed);
      const rearrangedColumns = new Map(entries);
      setBoard({ ...board, columns: rearrangedColumns });
    }

    if (type === "card") {
      // The stap needed as the indexes are stored as a number 0,1,2,3 etc. instead of id's with DND library
      const columns = Array.from(board.columns);
      const startColIndex = columns[Number(source.droppableId)];
      const endColIndex = columns[Number(destination.droppableId)];

      const startCol: Column = {
        id: startColIndex[0],
        todos: startColIndex[1].todos,
      };
      const endCol: Column = {
        id: endColIndex[0],
        todos: endColIndex[1].todos,
      };

      if (!startCol || !endCol) return;

      if (source.index === destination.index && startCol.id === endCol.id)
        return;

      const newTodos = startCol.todos;
      const [todoMoved] = newTodos.splice(source.index, 1);

      if (startCol.id === endCol.id) {
        // same column task drag
        newTodos.splice(destination.index, 0, todoMoved);
        const newCol = {
          id: startCol.id,
          todos: newTodos,
        };

        const newColumns = new Map(board.columns);
        newColumns.set(startCol.id, newCol);

        setBoard({ ...board, columns: newColumns });
      } else {
        // dragging to another column
        const newEndTodos = Array.from(endCol.todos);
        newEndTodos.splice(destination.index, 0, todoMoved);
        const newColumns = new Map(board.columns);

        const newStartCol = {
          id: startCol.id,
          todos: newTodos,
        };
        newColumns.set(startCol.id, newStartCol);
        const newEndCol = {
          id: endCol.id,
          todos: newEndTodos,
        };

        newColumns.set(endCol.id, newEndCol);

        updateTodoInDB(todoMoved, endCol.id);

        setBoard({ ...board, columns: newColumns });
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Droppable droppableId="board" direction={direction} type="column">
        {(provided) => (
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-7xl mx-auto"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {Array.from(board.columns.entries()).map(([id, column], index) => (
              <Column id={id} key={id} todos={column.todos} index={index} />
            ))}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default Board;
