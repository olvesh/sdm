/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    Goal,
    GoalWithPrecondition,
} from "./Goal";

/**
 * Represents goals set in response to a push
 */
export class Goals {

    public readonly goals: Goal[];

    constructor(public name: string, ...goals: Goal[]) {
        this.goals = goals;
    }
}

export function isGoals(a: any): a is Goals {
    return !!(a as Goals).goals;
}

/**
 *  Builder to build Goals instances.
 */
export interface GoalsBuilder {

    /**
     * Plan the given goal or goals to this Goals instance.
     * @param {Goal | Goals} goals
     * @returns {Goals & GoalsAndPreConditionBuilder}
     */
    plan(...goals: Array<Goal | Goals>): Goals & GoalsAndPreConditionBuilder;

}

/**
 * Extension to GoalsBuilder allowing to add preConditions,
 */
export interface GoalsAndPreConditionBuilder extends GoalsBuilder {

    /**
     * Add preCondition(s) to previously planned goal or goals.
     * Note:
     * This only will effect the goal or goals that where planned immediately
     * before calling after. Additional a call to this method will remove all pre conditions
     * that may have existed on the original goal.
     * @param {Goal} goals
     * @returns {Goals & GoalsBuilder}
     */
    after(...goals: Array<Goal>): Goals & GoalsBuilder;

}

/**
 * Create Goals instance using a fluent API.
 *
 *  const simpleGoals = goals("Simple Goals")
 *     .plan(ReviewGoal)
 *     .plan(BuildGoal, AutofixGoal).after(ReviewGoal)
 *     .plan(StagingEndpointGoal).after(BuildGoal)
 *     .plan(ProductionDeploymentGoal).after(BuildGoal, StagingEndpointGoal);
 *
 * @param {string} name
 * @returns {Goals & GoalsBuilder}
 */
export function goals(name: string): Goals & GoalsBuilder {
    return new DefaultGoalsBuilder(name);
}

class DefaultGoalsBuilder extends Goals implements GoalsBuilder, GoalsAndPreConditionBuilder {

    private lastGoals: Array<Goal> = [];

    constructor(public name: string) {
        super(name);
    }

    public plan(...newGoals: Array<Goal | Goals>): Goals & GoalsAndPreConditionBuilder {
        const currentGoals = [];

        // Keep track of what goals where last added so that we can add the preConditions later
        newGoals.forEach(g => {
            if (isGoals(g)) {
                currentGoals.push(...g.goals);
            } else {
                currentGoals.push(g);
            }
        });
        this.goals.push(...currentGoals);
        this.lastGoals = currentGoals;

        return this;
    }

    public after(...newGoals: Array<Goal>): Goals & GoalsBuilder {
        const lastGoalsWithPreConditions = [];

        this.lastGoals.forEach(g => {
            // Add the preCondition into the last added goals
            lastGoalsWithPreConditions.push(new GoalWithPrecondition(g.definition, ...newGoals));
            // Remove the previously added goals
            this.goals.splice(this.goals.indexOf(g), 1);
        });

        // Add the newly created goals with preConditions
        this.goals.push(...lastGoalsWithPreConditions);
        this.lastGoals = lastGoalsWithPreConditions;

        return this;
    }

}
