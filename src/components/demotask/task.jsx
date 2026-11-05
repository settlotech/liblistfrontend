import React from 'react';
import TaskPane from '../task/TaskPane';

export default function Task() {
    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            <TaskPane />
        </div>
    );
}
